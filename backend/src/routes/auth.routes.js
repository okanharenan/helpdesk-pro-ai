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

router.post('/register', register)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.get('/google', googleAuthUrl)
router.get('/facebook', facebookAuthUrl)
router.get('/me', protect, getMe)

module.exports = router