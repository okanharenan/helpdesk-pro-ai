const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createRemoteJWKSet, jwtVerify } = require("jose");
const { PrismaClient } = require("@prisma/client");
const { allowedOrigins } = require("./config/corsOrigins");
const { createRedisAdapterClients } = require("./config/redisAdapter");
const logger = require("./config/logger");
const prisma = new PrismaClient();

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

const PRESENCE_KEY = "presence:counts";

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  // Redis adapter: permite que io.emit/io.to() alcancem sockets conectados
  // em outras instâncias do backend (necessário assim que o Render escalar
  // para mais de uma instância). Sem REDIS_URL configurada, cai de volta
  // para o adapter padrão em memória (funciona, mas só numa instância).
  const redisClients = createRedisAdapterClients();
  if (redisClients) {
    const { pubClient, subClient } = redisClients;
    io.adapter(createAdapter(pubClient, subClient));
  }

  // Cliente usado para comandos normais (hash de presença). Reaproveita o
  // pubClient quando existe, pois ele não entra em modo "subscriber"
  // (isso é papel exclusivo do subClient no adapter do Socket.IO).
  const presenceStore = redisClients ? redisClients.pubClient : null;

  // Fallback em memória (só usado quando não há Redis configurado, ou seja,
  // rodando com uma única instância — não precisa ser compartilhado).
  const localPresence = new Map(); // userId -> contagem de sockets

  async function incrementPresence(userId) {
    if (presenceStore) {
      return presenceStore.hincrby(PRESENCE_KEY, userId, 1);
    }
    const next = (localPresence.get(userId) || 0) + 1;
    localPresence.set(userId, next);
    return next;
  }

  async function decrementPresence(userId) {
    if (presenceStore) {
      const next = await presenceStore.hincrby(PRESENCE_KEY, userId, -1);
      if (next <= 0) await presenceStore.hdel(PRESENCE_KEY, userId);
      return next;
    }
    const next = (localPresence.get(userId) || 1) - 1;
    if (next <= 0) localPresence.delete(userId);
    else localPresence.set(userId, next);
    return next;
  }

  async function listOnlineUserIds() {
    if (presenceStore) {
      const keys = await presenceStore.hkeys(PRESENCE_KEY);
      return keys;
    }
    return Array.from(localPresence.keys());
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));

      const { payload } = await jwtVerify(token, JWKS);
      if (!payload?.email) return next(new Error("unauthorized"));

      const dbUser = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, name: true, email: true, role: true, active: true },
      });

      if (!dbUser || dbUser.active === false) return next(new Error("unauthorized"));

      socket.user = dbUser;
      next();
    } catch (err) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = String(socket.user.id);
    socket.join(`user:${userId}`);

    try {
      const count = await incrementPresence(userId);
      if (count === 1) io.emit("presence:update", { userId, online: true });

      const online = await listOnlineUserIds();
      socket.emit("presence:list", online);
    } catch (err) {
      logger.error({ err }, "[socket] erro ao registrar presença");
    }

    socket.on("message:send", async ({ receiverId, body }) => {
      try {
        if (!receiverId || !body?.trim()) return;

        const receiver = await prisma.user.findUnique({ where: { id: Number(receiverId) } });
        if (!receiver) return socket.emit("message:error", { message: "Usuário não encontrado" });

        const message = await prisma.message.create({
          data: { senderId: Number(userId), receiverId: Number(receiverId), body: body.trim() },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        });

        io.to(`user:${userId}`).to(`user:${receiverId}`).emit("message:new", message);
      } catch (err) {
        logger.error({ err }, "[socket] erro ao enviar mensagem");
        socket.emit("message:error", { message: "Erro ao enviar mensagem" });
      }
    });

    socket.on("message:read", async ({ senderId }) => {
      try {
        if (!senderId) return;
        await prisma.message.updateMany({
          where: { senderId: Number(senderId), receiverId: Number(userId), read: false },
          data: { read: true },
        });
        io.to(`user:${senderId}`).emit("message:read-by", { readerId: userId });
      } catch (err) {
        logger.error({ err }, "[socket] erro ao marcar como lida");
      }
    });

    socket.on("typing", ({ receiverId }) => {
      if (receiverId) io.to(`user:${receiverId}`).emit("typing", { senderId: userId });
    });

    socket.on("disconnect", async () => {
      try {
        const remaining = await decrementPresence(userId);
        if (remaining <= 0) io.emit("presence:update", { userId, online: false });
      } catch (err) {
        logger.error({ err }, "[socket] erro ao remover presença");
      }
    });
  });

  return io;
}

module.exports = initSocket;
