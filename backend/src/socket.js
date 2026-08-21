const { Server } = require("socket.io");
const { createRemoteJWKSet, jwtVerify } = require("jose");
const { PrismaClient } = require("@prisma/client");
const { allowedOrigins } = require("./config/corsOrigins");
const prisma = new PrismaClient();

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  const onlineUsers = new Map(); // userId -> Set de socketIds

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

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    socket.join(`user:${userId}`);

    io.emit("presence:update", { userId, online: true });
    socket.emit("presence:list", Array.from(onlineUsers.keys()));

    socket.on("message:send", async ({ receiverId, body }) => {
      try {
        if (!receiverId || !body?.trim()) return;

        const receiver = await prisma.user.findUnique({ where: { id: Number(receiverId) } });
        if (!receiver) return socket.emit("message:error", { message: "Usuário não encontrado" });

        const message = await prisma.message.create({
          data: { senderId: userId, receiverId: Number(receiverId), body: body.trim() },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        });

        io.to(`user:${userId}`).to(`user:${receiverId}`).emit("message:new", message);
      } catch (err) {
        console.error("[socket] erro ao enviar mensagem:", err.message);
        socket.emit("message:error", { message: "Erro ao enviar mensagem" });
      }
    });

    socket.on("message:read", async ({ senderId }) => {
      try {
        if (!senderId) return;
        await prisma.message.updateMany({
          where: { senderId: Number(senderId), receiverId: userId, read: false },
          data: { read: true },
        });
        io.to(`user:${senderId}`).emit("message:read-by", { readerId: userId });
      } catch (err) {
        console.error("[socket] erro ao marcar como lida:", err.message);
      }
    });

    socket.on("typing", ({ receiverId }) => {
      if (receiverId) io.to(`user:${receiverId}`).emit("typing", { senderId: userId });
    });

    socket.on("disconnect", () => {
      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsers.delete(userId);
          io.emit("presence:update", { userId, online: false });
        }
      }
    });
  });

  return io;
}

module.exports = initSocket;