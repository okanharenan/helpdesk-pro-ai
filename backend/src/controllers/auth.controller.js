const { supabase } = require('../config/supabase')
const prisma = require('../config/prisma')
const cache = require('../helpers/cache')

const generateToken = (id) => {
  const jwt = require('jsonwebtoken')
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const register = async (req, res) => {
  const { name, email, password } = req.body

  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { name } }
  })

  if (error) return res.status(400).json({ message: error.message })

  try {
    await prisma.user.create({
      data: { name, email, password: '', provider: 'email' }
    })
  } catch (e) {
    console.error('Prisma error:', e.message)
  }

  return res.status(201).json({
    user: data.user,
    token: data.session?.access_token
  })
}

const login = async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ message: 'Credenciais inválidas' })

  const dbUser = await prisma.user.findUnique({ where: { email } })

  const userPayload = { ...data.user, role: dbUser?.role }

  // Cacheia os dados do usuário por 5 minutos
  await cache.set(`me:${email}`, userPayload, 60 * 5)

  return res.json({ user: userPayload, token: data.session.access_token })
}

const forgotPassword = async (req, res) => {
  const { email } = req.body
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CLIENT_URL}/reset-password`
  })
  if (error) return res.status(400).json({ message: error.message })
  return res.json({ message: 'Email de recuperação enviado' })
}

const googleAuthUrl = async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.CLIENT_URL}/auth/callback` }
  })
  if (error) return res.status(400).json({ message: error.message })
  return res.json({ url: data.url })
}

const facebookAuthUrl = async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: `${process.env.CLIENT_URL}/auth/callback` }
  })
  if (error) return res.status(400).json({ message: error.message })
  return res.json({ url: data.url })
}

const getMe = async (req, res) => {
  const email = req.user.email
  const cacheKey = `me:${email}`

  // Tenta pegar do cache
  const cached = await cache.get(cacheKey)
  if (cached) {
    console.log(`Cache HIT: ${cacheKey}`)
    return res.json(typeof cached === 'string' ? JSON.parse(cached) : cached)
  }

  console.log(`Cache MISS: ${cacheKey}`)

  // Busca só no banco — sem chamar Supabase
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, provider: true }
  })

  if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' })

  const userPayload = { ...req.user, ...dbUser }

  await cache.set(cacheKey, userPayload, 60 * 5)

  return res.json(userPayload)
}

module.exports = { register, login, forgotPassword, googleAuthUrl, facebookAuthUrl, getMe }