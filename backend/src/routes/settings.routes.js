const router = require('express').Router()
const { getPermissions, updatePermission, getStats } = require('../controllers/settings.controller')
const { protect, requireRole } = require('../middlewares/auth.middleware')
const asyncHandler = require('../helpers/asyncHandler')

router.use(protect)
router.use(requireRole('SUPERADMIN'))

/**
 * @openapi
 * /settings/permissions:
 *   get:
 *     tags: [Settings]
 *     summary: Lista as permissões configuradas por perfil (apenas SUPERADMIN)
 *     responses:
 *       200: { description: Lista de permissões por role }
 *       403: { description: Sem permissão }
 */
router.get('/permissions', asyncHandler(getPermissions))

/**
 * @openapi
 * /settings/permissions/{role}:
 *   patch:
 *     tags: [Settings]
 *     summary: Atualiza as permissões de um perfil (apenas SUPERADMIN)
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema: { type: string, enum: [ADMIN, AGENT, CLIENT] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Mapa de flags booleanas de permissão (ex. canViewReports, canManageUsers)
 *     responses:
 *       200: { description: Permissão atualizada }
 *       403: { description: Sem permissão }
 */
router.patch('/permissions/:role', asyncHandler(updatePermission))

/**
 * @openapi
 * /settings/stats:
 *   get:
 *     tags: [Settings]
 *     summary: Métricas gerais do sistema para o dashboard administrativo
 *     responses:
 *       200: { description: Métricas do sistema }
 *       403: { description: Sem permissão }
 */
router.get('/stats', asyncHandler(getStats))

module.exports = router
