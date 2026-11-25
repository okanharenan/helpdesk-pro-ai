const prisma = require('../config/prisma')

const LIST_LIMIT = 50

// Minhas notificações (mais recentes primeiro) + quantas ainda não foram lidas
const getNotifications = async (req, res) => {
  const userId = req.user.dbId

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ])

  return res.json({ items, unreadCount })
}

// Marca uma notificação como lida (só se for minha)
const markAsRead = async (req, res) => {
  const userId = req.user.dbId
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Notificação inválida' })

  const result = await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  })

  // count 0 = não existe, não é minha ou já estava lida: em todos os casos o estado final é "lida"
  return res.json({ ok: true, updated: result.count })
}

const markAllAsRead = async (req, res) => {
  const userId = req.user.dbId
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
  return res.json({ ok: true, updated: result.count })
}

module.exports = { getNotifications, markAsRead, markAllAsRead }