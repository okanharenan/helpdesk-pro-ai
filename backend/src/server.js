require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth.routes')
const ticketRoutes = require('./routes/ticket.routes')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())

// Servir arquivos de upload estaticamente
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Erro interno' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))