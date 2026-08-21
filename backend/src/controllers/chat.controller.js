const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDbUser = (email) =>
  prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });

// Lista de conversas já iniciadas (última mensagem + não lidas)
const getConversations = async (req, res) => {
  const dbUser = await getDbUser(req.user.email);
  if (!dbUser) return res.status(404).json({ message: "Usuário não encontrado" });

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: dbUser.id }, { receiverId: dbUser.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  const map = new Map();
  for (const msg of messages) {
    const other = msg.senderId === dbUser.id ? msg.receiver : msg.sender;
    if (!map.has(other.id)) {
      map.set(other.id, {
        user: other,
        lastMessage: msg.body,
        lastMessageAt: msg.createdAt,
        unread: 0,
      });
    }
    if (msg.receiverId === dbUser.id && !msg.read) {
      map.get(other.id).unread += 1;
    }
  }

  return res.json(Array.from(map.values()));
};

// Todos os usuários ativos, pra iniciar uma conversa nova
const getContacts = async (req, res) => {
  const dbUser = await getDbUser(req.user.email);
  if (!dbUser) return res.status(404).json({ message: "Usuário não encontrado" });

  const users = await prisma.user.findMany({
    where: { id: { not: dbUser.id }, active: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return res.json(users);
};

// Histórico de mensagens com uma pessoa específica
const getMessages = async (req, res) => {
  const dbUser = await getDbUser(req.user.email);
  if (!dbUser) return res.status(404).json({ message: "Usuário não encontrado" });

  const otherId = Number(req.params.userId);
  if (!otherId) return res.status(400).json({ message: "Usuário inválido" });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: dbUser.id, receiverId: otherId },
        { senderId: otherId, receiverId: dbUser.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: dbUser.id, read: false },
    data: { read: true },
  });

  return res.json(messages);
};

module.exports = { getConversations, getContacts, getMessages };