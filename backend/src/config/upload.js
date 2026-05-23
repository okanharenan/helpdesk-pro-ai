const multer = require('multer')
const path = require('path')
const fs = require('fs')

const dir = 'uploads/'
if (!fs.existsSync(dir)) fs.mkdirSync(dir)

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, unique + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|doc|docx/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    if (ext) cb(null, true)
    else cb(new Error('Tipo de arquivo não permitido'))
  }
})

module.exports = upload