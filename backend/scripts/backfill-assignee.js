// Atribui ao SUPERADMIN os tickets já existentes que ainda estão sem responsável
// (tickets novos já nascem atribuídos). Uso: node scripts/backfill-assignee.js
// Por padrão só simula; passe --apply para gravar de verdade.
require('dotenv').config()
const prisma = require('../src/config/prisma')

async function main() {
  const apply = process.argv.includes('--apply')
  const superadmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN', active: true },
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  })
  if (!superadmin) throw new Error('Nenhum SUPERADMIN ativo encontrado')

  const where = { assigneeId: null, status: { in: ['OPEN', 'DOING'] } }
  const total = await prisma.ticket.count({ where })
  console.log(`${total} ticket(s) abertos/em andamento sem responsável → ${superadmin.name} (#${superadmin.id})`)

  if (!apply) return console.log('Simulação. Rode com --apply para gravar.')
  const { count } = await prisma.ticket.updateMany({ where, data: { assigneeId: superadmin.id } })
  console.log(`${count} ticket(s) atualizados.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())