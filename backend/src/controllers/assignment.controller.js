const prisma = require('../config/prisma')
const cache = require('../helpers/cache')
const {
  getSettings, MODES, AUTO_ASSIGN_ROLES, OPEN_STATUSES,
} = require('../helpers/autoAssign')

// Configuração atual + a equipe que entra na distribuição, com a carga de cada um
const getAssignmentSettings = async (req, res) => {
  const settings = await getSettings()

  const team = await prisma.user.findMany({
    where: { role: { in: AUTO_ASSIGN_ROLES }, active: true },
    orderBy: { id: 'asc' },
    select: { id: true, name: true, email: true, role: true, available: true },
  })

  const grouped = await prisma.ticket.groupBy({
    by: ['assigneeId'],
    where: { assigneeId: { in: team.map((u) => u.id) }, status: { in: OPEN_STATUSES } },
    _count: { _all: true },
  })
  const load = (id) => grouped?.find((g) => g.assigneeId === id)?._count?._all ?? 0

  return res.json({
    mode: settings.mode,
    lastAssignedId: settings.lastAssignedId ?? null,
    roles: AUTO_ASSIGN_ROLES,
    team: team.map((u) => ({ ...u, openTickets: load(u.id) })),
  })
}

// Só o SUPERADMIN escolhe o modo
const updateAssignmentSettings = async (req, res) => {
  const { mode } = req.body || {}
  if (!MODES.includes(mode)) {
    return res.status(400).json({ message: `Modo inválido. Use: ${MODES.join(', ')}` })
  }

  const settings = await prisma.assignmentSettings.upsert({
    where: { id: 1 },
    update: { mode },
    create: { id: 1, mode },
  })

  return res.json({ mode: settings.mode, lastAssignedId: settings.lastAssignedId ?? null })
}

const parseAvailable = (value) => (typeof value === 'boolean' ? value : null)

// O próprio agente liga/desliga a sua disponibilidade
const setMyAvailability = async (req, res) => {
  const available = parseAvailable(req.body?.available)
  if (available === null) return res.status(400).json({ message: 'Informe available como true ou false' })
  if (req.user.role === 'CLIENT') return res.status(403).json({ message: 'Sem permissão' })

  await prisma.user.update({ where: { id: req.user.dbId }, data: { available } })
  await cache.del(`me:${req.user.email}`)

  return res.json({ id: req.user.dbId, available })
}

// SUPERADMIN e ADMIN mudam a disponibilidade de qualquer agente
const setUserAvailability = async (req, res) => {
  const available = parseAvailable(req.body?.available)
  if (available === null) return res.status(400).json({ message: 'Informe available como true ou false' })

  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Usuário inválido' })

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } })
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' })
  if (user.role === 'CLIENT') return res.status(400).json({ message: 'Clientes não entram na distribuição' })

  await prisma.user.update({ where: { id }, data: { available } })
  await cache.del(`me:${user.email}`)

  return res.json({ id, available })
}

module.exports = {
  getAssignmentSettings, updateAssignmentSettings, setMyAvailability, setUserAvailability,
}