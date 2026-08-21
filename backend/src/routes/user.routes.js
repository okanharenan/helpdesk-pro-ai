const router = require('express').Router()
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/user.controller')
const { protect, requireRole } = require('../middlewares/auth.middleware')
const asyncHandler = require('../helpers/asyncHandler')

router.use(protect)
router.use(requireRole('SUPERADMIN', 'ADMIN'))

router.get('/', asyncHandler(getUsers))
router.post('/', asyncHandler(createUser))
router.patch('/:id', asyncHandler(updateUser))
router.delete('/:id', asyncHandler(deleteUser))

module.exports = router