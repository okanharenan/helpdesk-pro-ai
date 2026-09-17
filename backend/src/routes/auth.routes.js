const router = require('express').Router()
const {
  register,
  login,
  forgotPassword,
  googleAuthUrl,
  facebookAuthUrl,
  getMe
} = require('../controllers/auth.controller')
const { protect } = require('../middlewares/auth.middleware')
const asyncHandler = require('../helpers/asyncHandler')
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimit.middleware')
const { validate } = require('../middlewares/validate.middleware')
const { registerSchema, loginSchema, forgotPasswordSchema } = require('../schemas/auth.schema')

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Cria uma nova conta de usuário
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 120, example: "Maria Souza" }
 *               email: { type: string, format: email, example: "maria@empresa.com" }
 *               password: { type: string, minLength: 6, example: "senhaSegura123" }
 *     responses:
 *       201: { description: Usuário criado com sucesso }
 *       400: { description: Dados inválidos, $ref: '#/components/schemas/Error' }
 *       429: { description: Muitas tentativas — rate limit }
 */
router.post('/register', registerLimiter, validate(registerSchema), asyncHandler(register))

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Autentica um usuário e retorna o token JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "maria@empresa.com" }
 *               password: { type: string, example: "senhaSegura123" }
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { description: Credenciais inválidas }
 *       429: { description: Muitas tentativas — rate limit }
 */
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login))

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Envia e-mail de recuperação de senha
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: E-mail de recuperação enviado (se o e-mail existir) }
 *       429: { description: Muitas tentativas — rate limit }
 */
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), asyncHandler(forgotPassword))

/**
 * @openapi
 * /auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Retorna a URL de autenticação OAuth do Google
 *     security: []
 *     responses:
 *       200: { description: URL gerada com sucesso }
 */
router.get('/google', asyncHandler(googleAuthUrl))

/**
 * @openapi
 * /auth/facebook:
 *   get:
 *     tags: [Auth]
 *     summary: Retorna a URL de autenticação OAuth do Facebook
 *     security: []
 *     responses:
 *       200: { description: URL gerada com sucesso }
 */
router.get('/facebook', asyncHandler(facebookAuthUrl))

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Retorna os dados do usuário autenticado
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401: { description: Não autenticado }
 */
router.get('/me', protect, asyncHandler(getMe))

module.exports = router
