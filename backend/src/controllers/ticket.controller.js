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
  const perm = await getPermission(dbUser.role)

  const canViewAll = perm?.canViewAllTickets
  const cacheKey = canViewAll ? 'tickets:all' : `tickets:user:${dbUser.id}`

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

const updateTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  const perm = await getPermission(dbUser.role)
  const { status, priority, title, description } = req.body
  const ticketId = Number(req.params.id)

  // Verifica permissão de editar
  if (title || description) {
    if (!perm?.canEditTicket) {
      return res.status(403).json({ message: 'Sem permissão para editar tickets' })
    }
  }

  // Verifica permissão de alterar status
  if (status && !perm?.canChangeStatus) {
    return res.status(403).json({ message: 'Sem permissão para alterar status' })
  }

  // Verifica permissão de alterar prioridade
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
  await cache.invalidateTickets()
  return res.json(ticket)
}

const deleteTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  const perm = await getPermission(dbUser.role)

  if (!perm?.canDeleteTicket) {
    return res.status(403).json({ message: 'Sem permissão para deletar tickets' })
  }

  const ticketId = Number(req.params.id)

  await prisma.comment.deleteMany({ where: { ticketId } })
  await prisma.ticket.delete({ where: { id: ticketId } })

  await cache.del(`ticket:${ticketId}`)
  await cache.invalidateTickets()
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

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, addComment }