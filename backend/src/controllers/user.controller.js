const { supabaseAdmin } = require("../config/supabase");
const prisma = require("../config/prisma");
const cache = require("../helpers/cache");

const ALLOWED_ROLES = ["ADMIN", "AGENT", "CLIENT"];

const requireRole =
  (...roles) =>
  async (req, res, next) => {
    const dbUser = await prisma.user.findUnique({
      where: { email: req.user.email },
    });
    if (!dbUser || !roles.includes(dbUser.role)) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    req.dbUser = dbUser;
    next();
  };

const getUsers = async (req, res) => {
  const cacheKey = "users:all";

  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log("Cache HIT: users:all");
    return res.json(typeof cached === "string" ? JSON.parse(cached) : cached);
  }

  console.log("Cache MISS: users:all");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  await cache.set(cacheKey, users, cache.TTL.users);
  return res.json(users);
};

const createUser = async (req, res) => {
  const dbUser = await prisma.user.findUnique({
    where: { email: req.user.email },
  });
  if (dbUser.role !== "SUPERADMIN") {
    return res
      .status(403)
      .json({ message: "Apenas o SUPERADMIN pode criar usuários" });
  }

  const { name, email, password, role } = req.body;
  if (!ALLOWED_ROLES.includes(role)) {
    return res
      .status(400)
      .json({ message: "Role inválido. Use: ADMIN, AGENT ou CLIENT" });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) return res.status(400).json({ message: error.message });

  const user = await prisma.user.create({
    data: { name, email, password: "", role, provider: "email" },
  });

  // Invalida cache de usuários
  await cache.del("users:all");

  return res.status(201).json(user);
};

const updateUser = async (req, res) => {
  const dbUser = await prisma.user.findUnique({
    where: { email: req.user.email },
  });
  const { role } = req.body;
  const { id } = req.params;

  if (role && !ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: "Role inválido" });
  }

  const target = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!target)
    return res.status(404).json({ message: "Usuário não encontrado" });
  if (target.role === "SUPERADMIN") {
    return res
      .status(403)
      .json({ message: "Não é possível editar o SUPERADMIN" });
  }
  // Invalida cache do usuário atualizado
  await cache.del(`me:${target.email}`);
  await cache.del("users:all");

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: { ...(role && { role }) },
    select: { id: true, name: true, email: true, role: true },
  });

  // Invalida cache
  await cache.del("users:all");

  return res.json(user);
};

const deleteUser = async (req, res) => {
  const dbUser = await prisma.user.findUnique({
    where: { email: req.user.email },
  });
  if (dbUser.role !== "SUPERADMIN") {
    return res
      .status(403)
      .json({ message: "Apenas o SUPERADMIN pode deletar usuários" });
  }

  const target = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!target)
    return res.status(404).json({ message: "Usuário não encontrado" });
  if (target.role === "SUPERADMIN") {
    return res
      .status(403)
      .json({ message: "Não é possível deletar o SUPERADMIN" });
  }

  const { data: supaUsers } = await supabaseAdmin.auth.admin.listUsers();
  const supaTarget = supaUsers.users.find((u) => u.email === target.email);
  if (supaTarget) await supabaseAdmin.auth.admin.deleteUser(supaTarget.id);

  await prisma.user.delete({ where: { id: Number(req.params.id) } });

  // Invalida cache
  await cache.del("users:all");

  return res.json({ message: "Usuário deletado" });
};

module.exports = { getUsers, createUser, updateUser, deleteUser, requireRole };
