const { supabase } = require('../config/supabase')

const protect = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autorizado' })
  }

  const token = auth.split(' ')[1]

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ message: 'Token inválido ou expirado' })
  }

  req.user = user
  next()
}

module.exports = { protect }