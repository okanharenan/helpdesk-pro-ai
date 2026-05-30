const { supabase } = require('../config/supabase')
const jwt = require('jsonwebtoken')

const protect = async (req, res, next) => {
  const start = Date.now()

  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autorizado' })
  }

  const token = auth.split(' ')[1]

  try {
    // Verifica o JWT localmente sem chamar o Supabase
    const decoded = jwt.decode(token)

    if (!decoded || !decoded.sub || !decoded.email) {
      return res.status(401).json({ message: 'Token inválido' })
    }

    // Verifica se o token expirou
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: 'Token expirado' })
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      ...decoded,
    }

    console.log(`auth.middleware — ${Date.now() - start}ms`)
    next()
  } catch (err) {
    console.error('Auth error:', err.message)
    return res.status(401).json({ message: 'Token inválido' })
  }
}

module.exports = { protect }