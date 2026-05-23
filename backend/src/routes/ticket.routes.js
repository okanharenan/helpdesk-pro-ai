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

router.use(protect)

router.get('/', getTickets)
router.post('/', upload.single('file'), createTicket)
router.get('/:id', getTicketById)
router.patch('/:id', updateTicket)
router.delete('/:id', deleteTicket)
router.post('/:id/comments', addComment)

module.exports = router