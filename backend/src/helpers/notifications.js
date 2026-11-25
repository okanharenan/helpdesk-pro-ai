const prisma = require('../config/prisma')
const { emitToUser } = require('./realtime')

// Cria notificações e avisa em tempo real quem está online.
// Aceita um item ou uma lista ({ userId, type, title, body?, ticketId? }); itens vazios são ignorados.
// Nunca derruba a ação principal: se falhar, só loga o erro.
const notify = async (entries) => {
  const list = (Array.isArray(entries) ? entries : [entries]).filter((e) => e && e.userId)
  for (const data of list) {
    try {
      const created = await prisma.notification.create({ data })
      if (created) emitToUser(data.userId, 'notification:new', created)
    } catch (err) {
      console.error('Falha ao criar notificação:', err.message)
    }
  }
}

module.exports = { notify }