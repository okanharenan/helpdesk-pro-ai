const router = require('express').Router()
const { getPermissions, updatePermission, getStats } = require('../controllers/settings.controller')
const { protect, requireRole } = require('../middlewares/auth.middleware')
const asyncHandler = require('../helpers/asyncHandler')

router.use(protect)

router.use((req, res, next) => {
  console.log('Settings — role:', req.user?.role, '| email:', req.user?.email)
  next()
})

router.use(requireRole('SUPERADMIN'))

router.get('/permissions', asyncHandler(getPermissions))
router.patch('/permissions/:role', asyncHandler(updatePermission))
router.get('/stats', asyncHandler(getStats))

module.exports = router