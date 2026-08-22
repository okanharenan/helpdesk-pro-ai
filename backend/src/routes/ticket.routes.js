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
const { validate } = require('../middlewares/validate.middleware')
const { createTicketSchema, updateTicketSchema, addCommentSchema } = require('../schemas/ticket.schema')

router.use(protect)

router.get('/', asyncHandler(getTickets))
router.post('/', upload.single('file'), validate(createTicketSchema), asyncHandler(createTicket))
router.get('/:id', asyncHandler(getTicketById))
router.patch('/:id', validate(updateTicketSchema), asyncHandler(updateTicket))
router.delete('/:id', asyncHandler(deleteTicket))
router.post('/:id/comments', validate(addCommentSchema), asyncHandler(addComment))

module.exports = router