const router = require('express').Router()
const { getPermissions, updatePermission, getStats } = require('../controllers/settings.controller')
const { protect, requireRole } = require('../middlewares/auth.middleware')

router.use(protect)
router.use(requireRole('SUPERADMIN'))

router.get('/permissions', getPermissions)
router.patch('/permissions/:role', updatePermission)
router.get('/stats', getStats)

module.exports = router