require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth.routes')
const ticketRoutes = require('./routes/ticket.routes')
const userRoutes = require('./routes/user.routes')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())

// Log de tempo — ANTES das rotas
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} — ${Date.now() - start}ms`)
  })
  next()
})

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/users', userRoutes)

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Erro interno' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))