const router = require('express').Router()
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/user.controller')
const { protect, requireRole } = require('../middlewares/auth.middleware')
const asyncHandler = require('../helpers/asyncHandler')
const { validate } = require('../middlewares/validate.middleware')
const { updateUserSchema } = require('../schemas/user.schema')

router.use(protect)
router.use(requireRole('SUPERADMIN', 'ADMIN'))

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Lista os usuários (apenas SUPERADMIN/ADMIN)
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       403: { description: Sem permissão }
 */
router.get('/', asyncHandler(getUsers))

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Cria um novo usuário (apenas SUPERADMIN/ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [ADMIN, AGENT, CLIENT] }
 *     responses:
 *       201:
 *         description: Usuário criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       403: { description: Sem permissão }
 */
router.post('/', asyncHandler(createUser))

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Atualiza papel (role) ou status ativo de um usuário
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
 *               role: { type: string, enum: [ADMIN, AGENT, CLIENT] }
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       403: { description: Sem permissão }
 *       404: { description: Usuário não encontrado }
 */
router.patch('/:id', validate(updateUserSchema), asyncHandler(updateUser))

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove um usuário
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Usuário removido }
 *       403: { description: Sem permissão }
 *       404: { description: Usuário não encontrado }
 */
router.delete('/:id', asyncHandler(deleteUser))

module.exports = router
