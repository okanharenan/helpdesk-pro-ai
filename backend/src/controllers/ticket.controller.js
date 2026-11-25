const prisma = require('../config/prisma')
const cache = require('../helpers/cache')
const { sendStatusChangeEmail } = require('../helpers/email')
const storage = require('../helpers/storage')
const { recordHistory } = require('../helpers/ticketHistory')
const { notify } = require('../helpers/notifications')

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

// Dados do solicitante e do responsável que vão junto em toda resposta de ticket
const USER_SELECT = { id: true, name: true, email: true }
const ASSIGNEE_SELECT = { id: true, name: true, role: true }

// Quem pode ver/mexer num ticket: quem tem "ver todos", o dono (solicitante) ou o responsável
const canAccessTicket = (perm, dbUser, ticket) =>
  !!perm?.canViewAllTickets ||
  ticket.userId === dbUser.id ||
  ticket.assigneeId === dbUser.id

// Filtro de "tickets que eu enxergo" para quem NÃO tem "ver todos"
const mineWhere = (userId) => ({ OR: [{ userId }, { assigneeId: userId }] })

// Nomes dos status para os textos das notificações
const STATUS_LABEL = { OPEN: 'Aberto', DOING: 'Em andamento', RESOLVED: 'Resolvido', CLOSED: 'Fechado' }

// Quem pode trocar o responsável de um ticket
const ASSIGNER_ROLES = ['SUPERADMIN', 'ADMIN']

// Limpa o cache das listas de todas as pessoas envolvidas (dono, responsável antigo e novo)
const invalidateLists = async (...userIds) => {
  const ids = [...new Set(userIds.filter(Boolean))]
  await cache.invalidateTickets() // tickets:all
  if (ids.length) await cache.del(...ids.map((id) => `tickets:user:${id}`))
}

const createTicket = async (req, res) => {
  const { title, description, priority } = req.body
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  if (!perm?.canCreateTicket) {
    return res.status(403).json({ message: 'Sem permissão para criar tickets' })
  }

  // Anexo: vai para o Supabase Storage (persistente). No banco guardamos só o caminho.
  let fileUrl = null
  if (req.file) {
    try {
      fileUrl = await storage.uploadTicketFile(req.file, dbUser.id)
    } catch (err) {
      const status = err.status || 502
      return res.status(status).json({ message: err.message || 'Falha ao enviar o anexo' })
    }
  }

  // Todo ticket já nasce com um SUPERADMIN como responsável.
  // Se quem abriu já é SUPERADMIN, ele mesmo fica como responsável; senão, o SUPERADMIN ativo mais antigo.
  let assigneeId = null
  if (dbUser.role === 'SUPERADMIN') {
    assigneeId = dbUser.id
  } else {
    const superadmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN', active: true },
      orderBy: { id: 'asc' },
      select: { id: true },
    })
    assigneeId = superadmin?.id ?? null
  }

  let ticket
  try {
    ticket = await prisma.ticket.create({
      data: { title, description, priority: priority || 'MEDIUM', fileUrl, userId: dbUser.id, assigneeId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: ASSIGNEE_SELECT },
      }
    })
  } catch (err) {
    // Se o ticket não foi criado, não deixa arquivo órfão no storage
    if (fileUrl) await storage.removeFile(fileUrl)
    throw err
  }

  await invalidateLists(dbUser.id, assigneeId)
  await recordHistory([
    { ticketId: ticket.id, actorId: dbUser.id, action: 'CREATED' },
    ticket.assignee && {
      ticketId: ticket.id, actorId: dbUser.id, action: 'AUTO_ASSIGNED', toValue: ticket.assignee.name,
    },
  ])

  // Avisa o responsável (se não foi ele mesmo quem abriu o ticket)
  if (ticket.assignee && ticket.assignee.id !== dbUser.id) {
    await notify({
      userId: ticket.assignee.id,
      type: 'ASSIGNED',
      ticketId: ticket.id,
      title: ticket.priority === 'HIGH'
        ? `Ticket urgente #${ticket.id} atribuído a você`
        : `Novo ticket #${ticket.id} atribuído a você`,
      body: ticket.title,
    })
  }
  return res.status(201).json(ticket)
}

const getTickets = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  const canViewAll = perm?.canViewAllTickets
  const cacheKey = canViewAll ? 'tickets:all' : `tickets:user:${dbUser.id}`

  const usePagination = req.query.page !== undefined

  // Sem `page` na query: comportamento igual ao que já existia (usado por
  // Dashboard, Navbar e Relatórios) — inclusive o cache continua funcionando igual.
  if (!usePagination) {
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log(`Cache HIT: ${cacheKey}`)
      return res.json(typeof cached === 'string' ? JSON.parse(cached) : cached)
    }

    console.log(`Cache MISS: ${cacheKey}`)
    const where = canViewAll ? {} : mineWhere(dbUser.id)

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: USER_SELECT },
        assignee: { select: ASSIGNEE_SELECT },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    await cache.set(cacheKey, tickets, cache.TTL.tickets)
    return res.json(tickets)
  }

  // Com `page` na query: modo paginado.
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20))
  const status = req.query.status && req.query.status !== 'ALL' ? req.query.status : undefined
  const search = req.query.search?.trim()
  const sort = req.query.sort === 'oldest' ? 'asc' : 'desc'

  // AND de condições: assim o OR da busca não colide com o OR de "meus tickets"
  const where = {
    AND: [
      canViewAll ? {} : mineWhere(dbUser.id),
      status ? { status } : {},
      search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
    ],
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        user: { select: USER_SELECT },
        assignee: { select: ASSIGNEE_SELECT },
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
  const baseWhere = canViewAll ? {} : mineWhere(dbUser.id)

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
    if (!canAccessTicket(perm, dbUser, ticket)) {
      return res.status(403).json({ message: 'Acesso negado' })
    }
    return res.json(ticket)
  }

  console.log(`Cache MISS: ${cacheKey}`)
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: USER_SELECT },
      assignee: { select: ASSIGNEE_SELECT },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' })
  if (!canAccessTicket(perm, dbUser, ticket)) {
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

  if (!canAccessTicket(perm, dbUser, existing)) {
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
    include: {
      user: { select: USER_SELECT },
      assignee: { select: ASSIGNEE_SELECT },
    }
  })

  await cache.del(`ticket:${ticketId}`)
  await invalidateLists(existing.userId, existing.assigneeId)

  await recordHistory([
    status && status !== existing.status && {
      ticketId, actorId: dbUser.id, action: 'STATUS_CHANGED', fromValue: existing.status, toValue: status,
    },
    priority && priority !== existing.priority && {
      ticketId, actorId: dbUser.id, action: 'PRIORITY_CHANGED', fromValue: existing.priority, toValue: priority,
    },
    ((title && title !== existing.title) || (description && description !== existing.description)) && {
      ticketId, actorId: dbUser.id, action: 'EDITED',
    },
  ])

  // Status mudou: avisa o solicitante e o responsável (menos quem fez a mudança)
  if (status && status !== existing.status) {
    const recipients = [...new Set([existing.userId, existing.assigneeId])]
      .filter((id) => id && id !== dbUser.id)
    await notify(recipients.map((userId) => ({
      userId,
      type: 'STATUS_CHANGED',
      ticketId,
      title: userId === existing.userId
        ? `Seu ticket #${ticketId} mudou para ${STATUS_LABEL[status]}`
        : `Ticket #${ticketId} mudou para ${STATUS_LABEL[status]}`,
      body: `${dbUser.name} alterou de ${STATUS_LABEL[existing.status]} para ${STATUS_LABEL[status]}`,
    })))
  }

  if (status && existing.status !== status) {
    sendStatusChangeEmail({
      to: ticket.user.email,
      name: ticket.user.name,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      oldStatus: existing.status,
      newStatus: status,
    })
  }

  return res.json(ticket)
}

// "Iniciar chamado": qualquer pessoa da equipe (não-CLIENT) assume um ticket SEM responsável.
// Se estava Aberto, passa para Em andamento. O dono do ticket recebe o e-mail de mudança de status.
const takeTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  if (dbUser.role === 'CLIENT') {
    return res.status(403).json({ message: 'Apenas a equipe de suporte pode assumir chamados' })
  }

  // Quem não enxerga os tickets de outras pessoas também não pode assumi-los
  const perm = await getPermission(dbUser.role)
  if (!perm?.canViewAllTickets) {
    return res.status(403).json({ message: 'Sem permissão para assumir chamados' })
  }

  const ticketId = Number(req.params.id)
  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!existing) return res.status(404).json({ message: 'Ticket não encontrado' })

  if (existing.assigneeId) {
    return res.status(409).json({
      message: existing.assigneeId === dbUser.id
        ? 'Você já é o responsável por este chamado'
        : 'Este chamado já tem um responsável',
    })
  }

  if (!['OPEN', 'DOING'].includes(existing.status)) {
    return res.status(409).json({ message: 'Só é possível assumir chamados abertos ou em andamento' })
  }

  const newStatus = existing.status === 'OPEN' ? 'DOING' : existing.status

  // As condições estão no próprio WHERE, então o banco decide o vencedor numa única operação:
  // se duas pessoas clicarem ao mesmo tempo, só uma atualiza (count = 1) e a outra recebe 409.
  const result = await prisma.ticket.updateMany({
    where: { id: ticketId, assigneeId: null, status: existing.status },
    data: { assigneeId: dbUser.id, status: newStatus },
  })

  if (result.count === 0) {
    return res.status(409).json({
      message: 'Este chamado acabou de ser assumido por outra pessoa. Atualize a página.',
    })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: USER_SELECT },
      assignee: { select: ASSIGNEE_SELECT },
    },
  })

  await cache.del(`ticket:${ticketId}`)
  await invalidateLists(ticket.userId, dbUser.id)

  await recordHistory([
    { ticketId, actorId: dbUser.id, action: 'TAKEN', toValue: dbUser.name },
    newStatus !== existing.status && {
      ticketId, actorId: dbUser.id, action: 'STATUS_CHANGED', fromValue: existing.status, toValue: newStatus,
    },
  ])

  // Avisa o solicitante que alguém começou o atendimento
  if (ticket.userId !== dbUser.id) {
    await notify({
      userId: ticket.userId,
      type: 'TAKEN',
      ticketId,
      title: `Seu ticket #${ticketId} foi assumido`,
      body: `${dbUser.name} começou o atendimento`,
    })
  }

  if (newStatus !== existing.status) {
    sendStatusChangeEmail({
      to: ticket.user.email,
      name: ticket.user.name,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      oldStatus: existing.status,
      newStatus,
    })
  }

  return res.json(ticket)
}

// SUPERADMIN e ADMIN trocam (ou removem) o responsável. assigneeId = null deixa o ticket sem responsável.
const assignTicket = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  if (!ASSIGNER_ROLES.includes(dbUser.role)) {
    return res.status(403).json({ message: 'Apenas SUPERADMIN e ADMIN podem trocar o responsável' })
  }

  const ticketId = Number(req.params.id)
  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignee: { select: ASSIGNEE_SELECT } },
  })
  if (!existing) return res.status(404).json({ message: 'Ticket não encontrado' })

  const { assigneeId } = req.body
  let newAssigneeId = null

  if (assigneeId !== null && assigneeId !== undefined) {
    const target = await prisma.user.findUnique({ where: { id: Number(assigneeId) } })
    if (!target || target.active === false) {
      return res.status(400).json({ message: 'Usuário não encontrado ou desativado' })
    }
    if (target.role === 'CLIENT') {
      return res.status(400).json({ message: 'Clientes não podem ser responsáveis por chamados' })
    }
    newAssigneeId = target.id
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { assigneeId: newAssigneeId },
    include: {
      user: { select: USER_SELECT },
      assignee: { select: ASSIGNEE_SELECT },
    },
  })

  await cache.del(`ticket:${ticketId}`)
  await invalidateLists(existing.userId, existing.assigneeId, newAssigneeId)

  // Só registra se o responsável realmente mudou
  if ((existing.assigneeId ?? null) !== newAssigneeId) {
    const action = newAssigneeId === null ? 'UNASSIGNED' : existing.assigneeId ? 'REASSIGNED' : 'ASSIGNED'
    await recordHistory({
      ticketId,
      actorId: dbUser.id,
      action,
      fromValue: existing.assignee?.name ?? null,
      toValue: ticket.assignee?.name ?? null,
    })

    // Avisa quem recebeu o ticket e quem deixou de ser responsável (menos quem fez a troca)
    await notify([
      newAssigneeId && newAssigneeId !== dbUser.id && {
        userId: newAssigneeId,
        type: 'ASSIGNED',
        ticketId,
        title: `Ticket #${ticketId} foi atribuído a você`,
        body: ticket.title ? `${dbUser.name} atribuiu: ${ticket.title}` : `${dbUser.name} atribuiu este ticket a você`,
      },
      existing.assigneeId && existing.assigneeId !== dbUser.id && {
        userId: existing.assigneeId,
        type: 'UNASSIGNED',
        ticketId,
        title: `Você não é mais responsável pelo ticket #${ticketId}`,
        body: ticket.assignee ? `Agora o responsável é ${ticket.assignee.name}` : 'O ticket ficou sem responsável',
      },
    ])
  }

  return res.json(ticket)
}

// Lista de pessoas que podem ser responsáveis (equipe ativa, sem clientes) — para o seletor de SUPERADMIN/ADMIN
const getAssignableUsers = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  if (!ASSIGNER_ROLES.includes(dbUser.role)) {
    return res.status(403).json({ message: 'Apenas SUPERADMIN e ADMIN podem ver esta lista' })
  }

  const users = await prisma.user.findMany({
    where: { active: true, role: { not: 'CLIENT' } },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  })

  return res.json(users)
}

// Linha do tempo do ticket (mais recente primeiro). Mesma regra de acesso do próprio ticket.
const getTicketHistory = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  const ticketId = Number(req.params.id)

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true, assigneeId: true },
  })
  if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' })
  if (!canAccessTicket(perm, dbUser, ticket)) {
    return res.status(403).json({ message: 'Acesso negado' })
  }

  const history = await prisma.ticketHistory.findMany({
    where: { ticketId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: { actor: { select: { id: true, name: true, role: true } } },
  })

  return res.json(history)
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

  // Limpa o anexo do storage (não bloqueia a resposta se falhar)
  if (existing.fileUrl) await storage.removeFile(existing.fileUrl)

  await cache.del(`ticket:${ticketId}`)
  await invalidateLists(existing.userId, existing.assigneeId)
  return res.json({ message: 'Ticket deletado' })
}

const getTicketAttachment = async (req, res) => {
  const dbUser = await getDbUser(req.user.email)
  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const perm = await getPermission(dbUser.role)
  const ticketId = Number(req.params.id)

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' })

  if (!canAccessTicket(perm, dbUser, ticket)) {
    return res.status(403).json({ message: 'Acesso negado' })
  }

  if (!ticket.fileUrl) {
    return res.status(404).json({ message: 'Este ticket não tem anexo' })
  }

  // Tickets antigos guardavam o arquivo no disco do servidor, que é apagado a cada deploy
  if (ticket.fileUrl.startsWith('/uploads/') || ticket.fileUrl.startsWith('http')) {
    return res.status(410).json({ message: 'Anexo indisponível (arquivo antigo, anterior à migração de armazenamento)' })
  }

  const url = await storage.getSignedUrl(ticket.fileUrl)
  if (!url) return res.status(404).json({ message: 'Anexo não encontrado no armazenamento' })

  return res.json({ url, expiresIn: storage.SIGNED_URL_TTL })
}

const addComment = async (req, res) => {
  const { body } = req.body
  const dbUser = await getDbUser(req.user.email)
  const perm = await getPermission(dbUser.role)
  const ticketId = Number(req.params.id)

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' })

  // Comenta quem tem "comentar em qualquer ticket", o dono do ticket ou o responsável
  if (!perm?.canCommentAny && ticket.userId !== dbUser.id && ticket.assigneeId !== dbUser.id) {
    return res.status(403).json({ message: 'Sem permissão para comentar neste ticket' })
  }

  const comment = await prisma.comment.create({
    data: { body, ticketId, userId: dbUser.id },
    include: { user: { select: { id: true, name: true, role: true } } }
  })

  await cache.del(`ticket:${ticketId}`)

  // Avisa a outra ponta da conversa: solicitante e responsável (menos quem comentou)
  const recipients = [...new Set([ticket.userId, ticket.assigneeId])]
    .filter((id) => id && id !== dbUser.id)
  await notify(recipients.map((userId) => ({
    userId,
    type: 'COMMENT',
    ticketId,
    title: `Novo comentário no ticket #${ticketId}`,
    body: `${dbUser.name}: ${String(body).slice(0, 80)}`,
  })))

  return res.status(201).json(comment)
}

module.exports = {
  createTicket, getTickets, getTicketById, updateTicket, deleteTicket, addComment,
  getTicketCounts, getTicketAttachment, takeTicket, assignTicket, getAssignableUsers,
  getTicketHistory,
}