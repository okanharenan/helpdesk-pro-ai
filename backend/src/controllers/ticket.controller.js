const prisma = require('../config/prisma')
const cache = require('../helpers/cache')

const getDbUser = (email) => prisma.user.findUnique({ where: { email } })

const createTicket = async (req, res) => {
  const { title, description, priority } = req.body
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const ticket = await prisma.ticket.create({
    data: { title, description, priority: priority || 'MEDIUM', fileUrl, userId: dbUser.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  })

  // Invalida cache de tickets
  await cache.invalidateTickets(dbUser.id)

  return res.status(201).json(ticket)
}

const getTickets = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  const isClient = dbUser.role === 'CLIENT'
  const cacheKey = isClient ? `tickets:user:${dbUser.id}` : 'tickets:all'

  // Tenta pegar do cache
  const cached = await cache.get(cacheKey)
  if (cached) {
    console.log(`Cache HIT: ${cacheKey}`)
    return res.json(typeof cached === 'string' ? JSON.parse(cached) : cached)
  }

  console.log(`Cache MISS: ${cacheKey}`)
  const where = isClient ? { userId: dbUser.id } : {}

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
  const ticketId = Number(req.params.id)
  const cacheKey = `ticket:${ticketId}`

  const cached = await cache.get(cacheKey)
  if (cached) {
    console.log(`Cache HIT: ${cacheKey}`)
    const ticket = typeof cached === 'string' ? JSON.parse(cached) : cached
    if (dbUser.role === 'CLIENT' && ticket.userId !== dbUser.id) {
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
  if (dbUser.role === 'CLIENT' && ticket.userId !== dbUser.id) {
    return res.status(403).json({ message: 'Acesso negado' })
  }

  await cache.set(cacheKey, ticket, cache.TTL.ticket)
  return res.json(ticket)
}

const updateTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!['SUPERADMIN', 'ADMIN'].includes(dbUser.role)) {
    return res.status(403).json({ message: 'Apenas admins podem atualizar tickets' })
  }

  const { status, priority } = req.body
  const ticketId = Number(req.params.id)

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { ...(status && { status }), ...(priority && { priority }) },
    include: { user: { select: { id: true, name: true, email: true } } }
  })

  // Invalida cache do ticket e da lista
  await cache.del(`ticket:${ticketId}`)
  await cache.invalidateTickets()

  return res.json(ticket)
}

const deleteTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (dbUser.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Apenas o SUPERADMIN pode deletar tickets' })
  }

  const ticketId = Number(req.params.id)

  await prisma.comment.deleteMany({ where: { ticketId } })
  await prisma.ticket.delete({ where: { id: ticketId } })

  // Invalida cache
  await cache.del(`ticket:${ticketId}`)
  await cache.invalidateTickets()

  return res.json({ message: 'Ticket deletado' })
}

const addComment = async (req, res) => {
  const { body } = req.body
  const dbUser = await getDbUser(req.user.email)
  const ticketId = Number(req.params.id)

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' })

  if (dbUser.role === 'CLIENT' && ticket.userId !== dbUser.id) {
    return res.status(403).json({ message: 'Você só pode comentar nos seus próprios tickets' })
  }

  const comment = await prisma.comment.create({
    data: { body, ticketId, userId: dbUser.id },
    include: { user: { select: { id: true, name: true, role: true } } }
  })

  // Invalida cache do ticket específico para refletir novo comentário
  await cache.del(`ticket:${ticketId}`)

  return res.status(201).json(comment)
}

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, addComment }