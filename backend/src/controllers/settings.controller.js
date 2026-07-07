const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = {
  ADMIN: {
    canViewAllTickets: true,
    canCreateTicket: true,
    canEditTicket: true,
    canDeleteTicket: false,
    canChangeStatus: true,
    canChangePriority: true,
    canCommentAny: true,
    canViewReports: true,
    canManageUsers: false,
    canViewUsers: true,
  },
  AGENT: {
    canViewAllTickets: true,
    canCreateTicket: true,
    canEditTicket: false,
    canDeleteTicket: false,
    canChangeStatus: false,
    canChangePriority: false,
    canCommentAny: true,
    canViewReports: true,
    canManageUsers: false,
    canViewUsers: false,
  },
  CLIENT: {
    canViewAllTickets: false,
    canCreateTicket: true,
    canEditTicket: false,
    canDeleteTicket: false,
    canChangeStatus: false,
    canChangePriority: false,
    canCommentAny: false,
    canViewReports: false,
    canManageUsers: false,
    canViewUsers: false,
  },
};

async function getPermissions(req, res) {
  try {
    const roles = ["ADMIN", "AGENT", "CLIENT"];
    const perms = [];
    for (const role of roles) {
      let p = await prisma.permission.findUnique({ where: { role } });
      if (!p) {
        p = await prisma.permission.create({
          data: { role, ...DEFAULT_PERMISSIONS[role] },
        });
      }
      perms.push(p);
    }
    res.json(perms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar permissões" });
  }
}

async function updatePermission(req, res) {
  const { role } = req.params;
  if (!["ADMIN", "AGENT", "CLIENT"].includes(role)) {
    return res.status(400).json({ message: "Role inválido" });
  }
  try {
    const perm = await prisma.permission.upsert({
      where: { role },
      update: req.body,
      create: { role, ...DEFAULT_PERMISSIONS[role], ...req.body },
    });
    res.json(perm);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar permissão" });
  }
}

async function getStats(req, res) {
  try {
    const [totalUsers, totalTickets, openTickets, resolvedTickets, byRole] =
      await Promise.all([
        prisma.user.count(),
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "OPEN" } }),
        prisma.ticket.count({ where: { status: "RESOLVED" } }),
        prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
      ]);
    res.json({
      totalUsers,
      totalTickets,
      openTickets,
      resolvedTickets,
      byRole,
    });
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar stats" });
  }
}

module.exports = { getPermissions, updatePermission, getStats };
