const router = require('express').Router()
const { getUsers, createUser, updateUser, deleteUser, requireRole } = require('../controllers/user.controller')
const { protect } = require('../middlewares/auth.middleware')

router.use(protect)
router.use(requireRole('SUPERADMIN', 'ADMIN'))

router.get('/', getUsers)
router.post('/', createUser)
router.patch('/:id', updateUser)
router.delete('/:id', deleteUser)

module.exports = router