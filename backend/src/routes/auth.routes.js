const router = require('express').Router()
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  addComment
} = require('../controllers/ticket.controller')
const { protect } = require('../middlewares/auth.middleware')
const upload = require('../config/upload')
const asyncHandler = require('../helpers/asyncHandler')

router.use(protect)

router.get('/', asyncHandler(getTickets))
router.post('/', upload.single('file'), asyncHandler(createTicket))
router.get('/:id', asyncHandler(getTicketById))
router.patch('/:id', asyncHandler(updateTicket))
router.delete('/:id', asyncHandler(deleteTicket))
router.post('/:id/comments', asyncHandler(addComment))

module.exports = router