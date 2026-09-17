const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const { getConversations, getContacts, getMessages } = require("../controllers/chat.controller");
const asyncHandler = require("../helpers/asyncHandler");

router.use(protect);

/**
 * @openapi
 * /chat/conversations:
 *   get:
 *     tags: [Chat]
 *     summary: Lista as conversas recentes do usuário autenticado
 *     responses:
 *       200: { description: Lista de conversas }
 */
router.get("/conversations", asyncHandler(getConversations));

/**
 * @openapi
 * /chat/contacts:
 *   get:
 *     tags: [Chat]
 *     summary: Lista os contatos disponíveis para iniciar uma conversa
 *     responses:
 *       200: { description: Lista de contatos }
 */
router.get("/contacts", asyncHandler(getContacts));

/**
 * @openapi
 * /chat/messages/{userId}:
 *   get:
 *     tags: [Chat]
 *     summary: Histórico de mensagens trocadas com outro usuário
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lista de mensagens }
 */
router.get("/messages/:userId", asyncHandler(getMessages));

module.exports = router;
