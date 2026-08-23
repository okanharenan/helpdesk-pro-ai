const prisma = require('../config/prisma')

const FULL_ACCESS = {
  canViewAllTickets: true,
  canCreateTicket: true,
  canEditTicket: true,
  canDeleteTicket: true,
  canChangeStatus: true,
  canChangePriority: true,
  canCommentAny: true,
  canViewReports: true,
  canManageUsers: true,
  canViewUsers: true,
}

async function getPermission(role) {
  if (role === 'SUPERADMIN') return FULL_ACCESS
  const perm = await prisma.permission.findUnique({ where: { role } })
  if (!perm) return null
  return perm
}

module.exports = { getPermission, FULL_ACCESS }