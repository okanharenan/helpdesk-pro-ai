// Ponte entre os controllers e o Socket.IO: quem cria um evento (ex.: nova notificação)
// avisa a pessoa na hora, sem o controller precisar conhecer o servidor de sockets.
let io = null

const setIo = (instance) => {
  io = instance
}

// Cada pessoa entra na sala `user:<id>` ao conectar (ver socket.js)
const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return
  io.to(`user:${userId}`).emit(event, payload)
}

module.exports = { setIo, emitToUser }