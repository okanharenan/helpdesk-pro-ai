const prisma = require('../config/prisma')
const cache = require('../helpers/cache')

const getDbUser = (email) => prisma.user.findUnique({ where: { email } })

const getPermission = async (role) => {
  if (role === 'SUPERADMIN') return {
    canViewAllTickets: true, canCreateTicket: true, canEditTicket: true,
    canDeleteTicket: true, canChangeStatus: true, canChangePriority: true,
    canCommentAny: true, canViewReports: true, canManageUsers: true, canViewUsers: true,
  }
  const perm = await prisma.permission.findUnique({ where: { role } })
  if (!perm) return null
  return perm
}

const createTicket = async (req, res) => {
  const { title, description, priority } = req.body
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  if (!perm?.canCreateTicket) {
    return res.status(403).json({ message: 'Sem permissão para criar tickets' })
  }

  const ticket = await prisma.ticket.create({
    data: { title, description, priority: priority || 'MEDIUM', fileUrl, userId: dbUser.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  })

  await cache.invalidateTickets(dbUser.id)
  return res.status(201).json(ticket)
}

const getTickets = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  const canViewAll = perm?.canViewAllTickets
  const cacheKey = canViewAll ? 'tickets:all' : `tickets:user:${dbUser.id}`

  const usePagination = req.query.page !== undefined

  // Sem `page` na query: comportamento 100% igual ao que já existia (usado por
  // Dashboard, Navbar e Relatórios) — inclusive o cache continua funcionando igual.
  if (!usePagination) {
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log(`Cache HIT: ${cacheKey}`)
      return res.json(typeof cached === 'string' ? JSON.parse(cached) : cached)
    }

    console.log(`Cache MISS: ${cacheKey}`)
    const where = canViewAll ? {} : { userId: dbUser.id }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    await cache.set(cacheKey, tickets, cache.TTL.tickets)
    return res.json(tickets)
  }

  // Com `page` na query: modo paginado, usado pela tela de Tickets.
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20))
  const status = req.query.status && req.query.status !== 'ALL' ? req.query.status : undefined
  const search = req.query.search?.trim()
  const sort = req.query.sort === 'oldest' ? 'asc' : 'desc'

  const where = {
    ...(canViewAll ? {} : { userId: dbUser.id }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: sort },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ])

  return res.json({
    tickets,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}

const getTicketCounts = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  const canViewAll = perm?.canViewAllTickets
  const baseWhere = canViewAll ? {} : { userId: dbUser.id }

  const [all, open, doing, resolved, closed] = await Promise.all([
    prisma.ticket.count({ where: baseWhere }),
    prisma.ticket.count({ where: { ...baseWhere, status: 'OPEN' } }),
    prisma.ticket.count({ where: { ...baseWhere, status: 'DOING' } }),
    prisma.ticket.count({ where: { ...baseWhere, status: 'RESOLVED' } }),
    prisma.ticket.count({ where: { ...baseWhere, status: 'CLOSED' } }),
  ])

  return res.json({ ALL: all, OPEN: open, DOING: doing, RESOLVED: resolved, CLOSED: closed })
}

const getTicketById = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  const perm = await getPermission(dbUser.role)
  const ticketId = Number(req.params.id)
  const cacheKey = `ticket:${ticketId}`

  const cached = await cache.get(cacheKey)
  if (cached) {
    console.log(`Cache HIT: ${cacheKey}`)
    const ticket = typeof cached === 'string' ? JSON.parse(cached) : cached
    if (!perm?.canViewAllTickets && ticket.userId !== dbUser.id) {
      return res.status(403).json({ message: 'Acesso negado' })
    }
    return res.json(ticket)
  }

  console.log(`Cache MISS: ${cacheKey}`)
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' })
  if (!perm?.canViewAllTickets && ticket.userId !== dbUser.id) {
    return res.status(403).json({ message: 'Acesso negado' })
  }

  await cache.set(cacheKey, ticket, cache.TTL.ticket)
  return res.json(ticket)
}

const VALID_STATUS = ['OPEN', 'DOING', 'RESOLVED', 'CLOSED']
const VALID_PRIORITY = ['LOW', 'MEDIUM', 'HIGH']

const updateTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  const { status, priority, title, description } = req.body
  const ticketId = Number(req.params.id)

  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!existing) return res.status(404).json({ message: 'Ticket não encontrado' })

  const isOwner = existing.userId === dbUser.id
  if (!perm?.canViewAllTickets && !isOwner) {
    return res.status(403).json({ message: 'Acesso negado' })
  }

  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ message: 'Status inválido' })
  }
  if (priority && !VALID_PRIORITY.includes(priority)) {
    return res.status(400).json({ message: 'Prioridade inválida' })
  }

  if ((title || description) && !perm?.canEditTicket) {
    return res.status(403).json({ message: 'Sem permissão para editar tickets' })
  }
  if (status && !perm?.canChangeStatus) {
    return res.status(403).json({ message: 'Sem permissão para alterar status' })
  }
  if (priority && !perm?.canChangePriority) {
    return res.status(403).json({ message: 'Sem permissão para alterar prioridade' })
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(title && { title }),
      ...(description && { description }),
    },
    include: { user: { select: { id: true, name: true, email: true } } }
  })

  await cache.del(`ticket:${ticketId}`)
  await cache.invalidateTickets(existing.userId)
  return res.json(ticket)
}

const deleteTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  const ticketId = Number(req.params.id)

  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!existing) return res.status(404).json({ message: 'Ticket não encontrado' })

  const isOwner = existing.userId === dbUser.id
  if (!perm?.canDeleteTicket || (!perm?.canViewAllTickets && !isOwner)) {
    return res.status(403).json({ message: 'Sem permissão para deletar tickets' })
  }

  await prisma.comment.deleteMany({ where: { ticketId } })
  await prisma.ticket.delete({ where: { id: ticketId } })

  await cache.del(`ticket:${ticketId}`)
  await cache.invalidateTickets(existing.userId)
  return res.json({ message: 'Ticket deletado' })
}

const addComment = async (req, res) => {
  const { body } = req.body
  const dbUser = await getDbUser(req.user.email)
  const perm = await getPermission(dbUser.role)
  const ticketId = Number(req.params.id)

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' })

  // CLIENT só comenta nos próprios, outros precisam de canCommentAny
  if (!perm?.canCommentAny && ticket.userId !== dbUser.id) {
    return res.status(403).json({ message: 'Sem permissão para comentar neste ticket' })
  }

  const comment = await prisma.comment.create({
    data: { body, ticketId, userId: dbUser.id },
    include: { user: { select: { id: true, name: true, role: true } } }
  })

  await cache.del(`ticket:${ticketId}`)
  return res.status(201).json(comment)
}

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, addComment, getTicketCounts }