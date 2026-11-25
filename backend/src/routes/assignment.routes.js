const router = require('express').Router()
const {
  getAssignmentSettings, updateAssignmentSettings, setMyAvailability, setUserAvailability,
} = require('../controllers/assignment.controller')
const { protect, requireRole } = require('../middlewares/auth.middleware')
const asyncHandler = require('../helpers/asyncHandler')

router.use(protect)

// Qualquer pessoa da equipe liga/desliga a própria disponibilidade
router.patch('/availability', asyncHandler(setMyAvailability))

// Gestão: SUPERADMIN e ADMIN veem a configuração e mexem na disponibilidade da equipe
router.get('/settings', requireRole('SUPERADMIN', 'ADMIN'), asyncHandler(getAssignmentSettings))
router.patch('/availability/:id', requireRole('SUPERADMIN', 'ADMIN'), asyncHandler(setUserAvailability))

// Só o SUPERADMIN escolhe o modo de distribuição
router.patch('/settings', requireRole('SUPERADMIN'), asyncHandler(updateAssignmentSettings))

module.exports = router