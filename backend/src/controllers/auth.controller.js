const { supabase } = require('../config/supabase')
const prisma = require('../config/prisma')

const register = async (req, res) => {
  console.log('Body recebido:', req.body)
  const { name, email, password } = req.body

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  })

  console.log('Supabase response:', { data, error })

  if (error) return res.status(400).json({ message: error.message })

  try {
    await prisma.user.create({
      data: { name, email, password: '', provider: 'email' }
    })
  } catch (prismaError) {
    console.error('Prisma error:', prismaError.message)
  }

  return res.status(201).json({
    user: data.user,
    token: data.session?.access_token
  })
}

const login = async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) return res.status(401).json({ message: 'Credenciais inválidas' })

  const user = await prisma.user.findUnique({ where: { email } })

  return res.json({
    user: { ...data.user, role: user?.role },
    token: data.session.access_token
  })
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
  const user = await prisma.user.findUnique({
    where: { email: req.user.email }
  })
  return res.json({ ...req.user, role: user?.role })
}

module.exports = { register, login, forgotPassword, googleAuthUrl, facebookAuthUrl, getMe }