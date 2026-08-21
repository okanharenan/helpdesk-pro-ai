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

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post('/forgot-password', asyncHandler(forgotPassword))
router.get('/google', asyncHandler(googleAuthUrl))
router.get('/facebook', asyncHandler(facebookAuthUrl))
router.get('/me', protect, asyncHandler(getMe))

module.exports = router