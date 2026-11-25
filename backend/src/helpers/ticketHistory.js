const prisma = require('../config/prisma')

// Registra eventos no histórico do ticket.
// Nunca derruba a ação principal: se o registro falhar, só loga o erro.
const recordHistory = async (entries) => {
  const data = (Array.isArray(entries) ? entries : [entries]).filter(Boolean)
  if (!data.length) return
  try {
    await prisma.ticketHistory.createMany({ data })
  } catch (err) {
    console.error('Falha ao registrar histórico do ticket:', err.message)
  }
}

module.exports = { recordHistory }