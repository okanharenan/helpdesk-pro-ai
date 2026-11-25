const prisma = require('../config/prisma')

// SUPERADMIN   = todo ticket novo vai para o SUPERADMIN (comportamento original)
// ROUND_ROBIN  = rodízio: cada ticket novo vai para o próximo agente da fila
// LEAST_LOADED = vai para o agente com menos tickets abertos/em andamento
const MODES = ['SUPERADMIN', 'ROUND_ROBIN', 'LEAST_LOADED']

// Quem entra na distribuição automática. Para incluir ADMIN, basta adicionar aqui.
const AUTO_ASSIGN_ROLES = ['AGENT']

const OPEN_STATUSES = ['OPEN', 'DOING']

const getSettings = async () => {
  try {
    const settings = await prisma.assignmentSettings.findUnique({ where: { id: 1 } })
    if (settings && MODES.includes(settings.mode)) return settings
  } catch (err) {
    console.error('Falha ao ler configuração de distribuição:', err.message)
  }
  return { mode: 'SUPERADMIN', lastAssignedId: null }
}

// Agentes ativos e disponíveis, em ordem fixa (por id)
const getPool = () =>
  prisma.user.findMany({
    where: { role: { in: AUTO_ASSIGN_ROLES }, active: true, available: true },
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  })

// Próximo da fila depois do último que recebeu; se chegou ao fim, volta ao primeiro
const nextAfter = (list, lastId) => list.find((u) => u.id > (lastId ?? 0)) || list[0]

const pickFromPool = async (mode, settings) => {
  const pool = await getPool()
  if (!pool?.length) return null

  if (mode === 'ROUND_ROBIN') return nextAfter(pool, settings.lastAssignedId)

  // LEAST_LOADED: fica com quem tem menos tickets em aberto; empate resolve pelo rodízio
  const grouped = await prisma.ticket.groupBy({
    by: ['assigneeId'],
    where: { assigneeId: { in: pool.map((u) => u.id) }, status: { in: OPEN_STATUSES } },
    _count: { _all: true },
  })
  const load = (id) => grouped?.find((g) => g.assigneeId === id)?._count?._all ?? 0
  const min = Math.min(...pool.map((u) => load(u.id)))
  const tied = pool.filter((u) => load(u.id) === min)
  return nextAfter(tied, settings.lastAssignedId)
}

// Guarda quem recebeu por último (não derruba a criação do ticket se falhar)
const saveCursor = async (mode, userId) => {
  try {
    await prisma.assignmentSettings.upsert({
      where: { id: 1 },
      update: { lastAssignedId: userId },
      create: { id: 1, mode, lastAssignedId: userId },
    })
  } catch (err) {
    console.error('Falha ao salvar o ponto do rodízio:', err.message)
  }
}

// Decide quem fica com um ticket novo.
// Retorna { assigneeId, strategy }; strategy é SUPERADMIN, ROUND_ROBIN, LEAST_LOADED ou FALLBACK
// (FALLBACK = a distribuição está ligada, mas não há agente disponível, então vai para o SUPERADMIN).
const pickAssignee = async (creator) => {
  const settings = await getSettings()
  let strategy = settings.mode

  if (strategy !== 'SUPERADMIN') {
    const chosen = await pickFromPool(strategy, settings)
    if (chosen) {
      await saveCursor(strategy, chosen.id)
      return { assigneeId: chosen.id, strategy }
    }
    strategy = 'FALLBACK'
  }

  // Quem abriu o ticket é SUPERADMIN: fica com ele mesmo
  if (creator.role === 'SUPERADMIN') return { assigneeId: creator.id, strategy }

  const superadmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN', active: true },
    orderBy: { id: 'asc' },
    select: { id: true },
  })
  return { assigneeId: superadmin?.id ?? null, strategy }
}

module.exports = { pickAssignee, getSettings, getPool, MODES, AUTO_ASSIGN_ROLES, OPEN_STATUSES }