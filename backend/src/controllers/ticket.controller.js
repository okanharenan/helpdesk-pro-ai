const prisma = require('../config/prisma')

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
  return res.status(201).json(ticket)
}

const getTickets = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  const where = dbUser.role === 'CLIENT' ? { userId: dbUser.id } : {}

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return res.json(tickets)
}

const getTicketById = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(req.params.id) },
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

  return res.json(ticket)
}

const updateTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)

  if (!['SUPERADMIN', 'ADMIN'].includes(dbUser.role)) {
    return res.status(403).json({ message: 'Apenas admins podem atualizar tickets' })
  }

  const { status, priority } = req.body
  const ticket = await prisma.ticket.update({
    where: { id: Number(req.params.id) },
    data: { ...(status && { status }), ...(priority && { priority }) },
    include: { user: { select: { id: true, name: true, email: true } } }
  })
  return res.json(ticket)
}

const deleteTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)

  if (dbUser.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Apenas o SUPERADMIN pode deletar tickets' })
  }

  await prisma.ticket.delete({ where: { id: Number(req.params.id) } })
  return res.json({ message: 'Ticket deletado' })
}

const addComment = async (req, res) => {
  const { body } = req.body
  const dbUser = await getDbUser(req.user.email)

  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } })
  if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' })

  // CLIENT só comenta no próprio ticket
  if (dbUser.role === 'CLIENT' && ticket.userId !== dbUser.id) {
    return res.status(403).json({ message: 'Você só pode comentar nos seus próprios tickets' })
  }

  const comment = await prisma.comment.create({
    data: { body, ticketId: ticket.id, userId: dbUser.id },
    include: { user: { select: { id: true, name: true, role: true } } }
  })
  return res.status(201).json(comment)
}

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, addComment }