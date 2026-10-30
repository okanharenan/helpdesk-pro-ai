const path = require('path')
const crypto = require('crypto')
const { supabaseAdmin } = require('../config/supabase')

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'ticket-attachments'
const SIGNED_URL_TTL = 60 // segundos que o link de download fica válido

// Extensão -> tipos MIME aceitos + "assinatura" (primeiros bytes) real do arquivo
const ALLOWED = {
  '.jpg':  { mimes: ['image/jpeg'], magic: [[0xff, 0xd8, 0xff]] },
  '.jpeg': { mimes: ['image/jpeg'], magic: [[0xff, 0xd8, 0xff]] },
  '.png':  { mimes: ['image/png'],  magic: [[0x89, 0x50, 0x4e, 0x47]] },
  '.pdf':  { mimes: ['application/pdf'], magic: [[0x25, 0x50, 0x44, 0x46]] },
  '.doc':  { mimes: ['application/msword'], magic: [[0xd0, 0xcf, 0x11, 0xe0]] },
  '.docx': {
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    magic: [[0x50, 0x4b, 0x03, 0x04]],
  },
}

const fail = (message, status = 400) => {
  const err = new Error(message)
  err.status = status
  return err
}

// Confere extensão, MIME declarado e os bytes reais do arquivo (não confia só no nome)
function validateFile(file) {
  const ext = path.extname(file.originalname).toLowerCase()
  const rule = ALLOWED[ext]
  if (!rule) throw fail('Tipo de arquivo não permitido')
  if (!rule.mimes.includes(file.mimetype)) throw fail('Tipo de arquivo não permitido')

  const head = file.buffer.subarray(0, 8)
  const matches = rule.magic.some((sig) => sig.every((byte, i) => head[i] === byte))
  if (!matches) throw fail('O conteúdo do arquivo não corresponde à extensão informada')

  return ext
}

async function uploadTicketFile(file, userId) {
  const ext = validateFile(file)
  const filePath = `tickets/${userId}/${Date.now()}-${crypto.randomUUID()}${ext}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false })

  if (error) {
    console.error('[storage] falha no upload:', error.message)
    throw fail('Não foi possível salvar o anexo. Tente novamente.', 502)
  }
  return filePath
}

async function getSignedUrl(filePath) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL)
  if (error) {
    console.error('[storage] falha ao gerar link:', error.message)
    return null
  }
  return data.signedUrl
}

async function removeFile(filePath) {
  try {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([filePath])
    if (error) console.error('[storage] falha ao remover arquivo:', error.message)
  } catch (err) {
    console.error('[storage] falha ao remover arquivo:', err.message)
  }
}

module.exports = { uploadTicketFile, getSignedUrl, removeFile, SIGNED_URL_TTL, BUCKET }