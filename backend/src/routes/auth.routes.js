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

router.post('/register', registerLimiter, validate(registerSchema), asyncHandler(register))
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login))
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), asyncHandler(forgotPassword))
router.get('/google', asyncHandler(googleAuthUrl))
router.get('/facebook', asyncHandler(facebookAuthUrl))
router.get('/me', protect, asyncHandler(getMe))

module.exports = router