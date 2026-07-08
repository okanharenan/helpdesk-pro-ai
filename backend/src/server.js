require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes     = require('./routes/auth.routes')
const ticketRoutes   = require('./routes/ticket.routes')
const userRoutes     = require('./routes/user.routes')
const settingsRoutes = require('./routes/settings.routes')

const app = express()

const allowedOrigins = [
  'https://helpdesk-pro-ai.vercel.app',
  'https://helpdesk-pro-ai-okanharenans-projects.vercel.app',
  'https://www.helpdesk-pro-ai.com.br',
  'http://localhost:5173',
  'http://localhost:5174',
]

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.log('CORS bloqueado para origem:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json())

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} — ${Date.now() - start}ms`)
  })
  next()
})

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth',     authRoutes)
app.use('/api/tickets',  ticketRoutes)
app.use('/api/users',    userRoutes)
app.use('/api/settings', settingsRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Erro interno' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))