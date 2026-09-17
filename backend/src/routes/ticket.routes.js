const router = require('express').Router()
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  addComment,
  getTicketCounts
} = require('../controllers/ticket.controller')
const { protect } = require('../middlewares/auth.middleware')
const upload = require('../config/upload')
const asyncHandler = require('../helpers/asyncHandler')
const { validate } = require('../middlewares/validate.middleware')
const { createTicketSchema, updateTicketSchema, addCommentSchema } = require('../schemas/ticket.schema')

router.use(protect)

/**
 * @openapi
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: Lista os chamados visíveis para o usuário autenticado
 *     responses:
 *       200:
 *         description: Lista de chamados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Ticket' }
 *       401: { description: Não autenticado }
 */
router.get('/', asyncHandler(getTickets))

/**
 * @openapi
 * /tickets/counts:
 *   get:
 *     tags: [Tickets]
 *     summary: Retorna a contagem de chamados por status (usado no dashboard)
 *     responses:
 *       200:
 *         description: Contagens por status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: { OPEN: 5, DOING: 2, RESOLVED: 10, CLOSED: 20 }
 */
router.get('/counts', asyncHandler(getTicketCounts))

/**
 * @openapi
 * /tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Cria um novo chamado (com anexo opcional)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string, minLength: 3, maxLength: 150 }
 *               description: { type: string, minLength: 3, maxLength: 5000 }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH], default: MEDIUM }
 *               file: { type: string, format: binary, description: "Anexo opcional" }
 *     responses:
 *       201:
 *         description: Chamado criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ticket' }
 *       400: { description: Dados inválidos }
 */
router.post('/', upload.single('file'), validate(createTicketSchema), asyncHandler(createTicket))

/**
 * @openapi
 * /tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Busca um chamado pelo id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Chamado encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ticket' }
 *       404: { description: Chamado não encontrado }
 */
router.get('/:id', asyncHandler(getTicketById))

/**
 * @openapi
 * /tickets/{id}:
 *   patch:
 *     tags: [Tickets]
 *     summary: Atualiza um chamado (título, descrição, status ou prioridade)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 3, maxLength: 150 }
 *               description: { type: string, minLength: 3, maxLength: 5000 }
 *               status: { type: string, enum: [OPEN, DOING, RESOLVED, CLOSED] }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *     responses:
 *       200:
 *         description: Chamado atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ticket' }
 *       403: { description: Sem permissão para essa alteração }
 *       404: { description: Chamado não encontrado }
 */
router.patch('/:id', validate(updateTicketSchema), asyncHandler(updateTicket))

/**
 * @openapi
 * /tickets/{id}:
 *   delete:
 *     tags: [Tickets]
 *     summary: Remove um chamado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Chamado removido }
 *       403: { description: Sem permissão }
 *       404: { description: Chamado não encontrado }
 */
router.delete('/:id', asyncHandler(deleteTicket))

/**
 * @openapi
 * /tickets/{id}/comments:
 *   post:
 *     tags: [Tickets]
 *     summary: Adiciona um comentário a um chamado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string, minLength: 1, maxLength: 3000 }
 *     responses:
 *       201:
 *         description: Comentário criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TicketComment' }
 *       404: { description: Chamado não encontrado }
 */
router.post('/:id/comments', validate(addCommentSchema), asyncHandler(addComment))

module.exports = router
