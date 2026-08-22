const router = require('express').Router()
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/user.controller')
const { protect, requireRole } = require('../middlewares/auth.middleware')
const asyncHandler = require('../helpers/asyncHandler')
const { validate } = require('../middlewares/validate.middleware')
const { updateUserSchema } = require('../schemas/user.schema')

router.use(protect)
router.use(requireRole('SUPERADMIN', 'ADMIN'))

router.get('/', asyncHandler(getUsers))
router.post('/', asyncHandler(createUser))
router.patch('/:id', validate(updateUserSchema), asyncHandler(updateUser))
router.delete('/:id', asyncHandler(deleteUser))

module.exports = router