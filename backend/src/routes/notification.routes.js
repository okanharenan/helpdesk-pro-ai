const router = require('express').Router()
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller')
const { protect } = require('../middlewares/auth.middleware')
const asyncHandler = require('../helpers/asyncHandler')

router.use(protect)

router.get('/', asyncHandler(getNotifications))
router.post('/read-all', asyncHandler(markAllAsRead))
router.patch('/:id/read', asyncHandler(markAsRead))

module.exports = router