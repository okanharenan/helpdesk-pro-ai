import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import { useThemeColors } from '../../hooks/useThemeColors'

const API = import.meta.env.VITE_API_URL

const STATUS_OPTIONS = ['OPEN', 'DOING', 'RESOLVED', 'CLOSED']
const STATUS = {
  OPEN:     { label: 'Aberto',       bg: 'rgba(255,77,77,0.12)',  color: '#ff4d4d' },
  DOING:    { label: 'Em andamento', bg: 'rgba(77,159,255,0.12)', color: '#4d9fff' },
  RESOLVED: { label: 'Resolvido',    bg: 'rgba(100,200,50,0.15)', color: '#5cb800' },
  CLOSED:   { label: 'Fechado',      bg: 'rgba(120,120,120,0.1)', color: '#888888' },
}
const PRIORITY = {
  HIGH:   { label: 'Alta',  color: '#ff4d4d' },
  MEDIUM: { label: 'Média', color: '#ffaa4d' },
  LOW:    { label: 'Baixa', color: '#888888' },
}

export default function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const t = useThemeColors()
  const [ticket, setTicket] = useState(null)
  const [dbRole, setDbRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  const token = localStorage.getItem('helpdesk_token')
  const headers = { Authorization: `Bearer ${token}` }
  const canEdit   = ['SUPERADMIN', 'ADMIN'].includes(dbRole)
  const canDelete = dbRole === 'SUPERADMIN'

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/tickets/${id}`, { headers }),
      axios.get(`${API}/auth/me`, { headers }),
    ]).then(([ticketRes, meRes]) => {
      setTicket(ticketRes.data)
      setDbRole(meRes.data.role)
    }).catch(() => navigate('/tickets'))
     .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (status) => {
    setUpdating(true)
    try {
      const { data } = await axios.patch(`${API}/tickets/${id}`, { status }, { headers })
      setTicket(prev => ({ ...prev, status: data.status }))
    } finally { setUpdating(false) }
  }

  const handlePriorityChange = async (priority) => {
    setUpdating(true)
    try {
      const { data } = await axios.patch(`${API}/tickets/${id}`, { priority }, { headers })
      setTicket(prev => ({ ...prev, priority: data.priority }))
    } finally { setUpdating(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Deletar este ticket permanentemente?')) return
    await axios.delete(`${API}/tickets/${id}`, { headers })
    navigate('/tickets')
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSending(true)
    try {
      const { data } = await axios.post(`${API}/tickets/${id}/comments`, { body: comment }, { headers })
      setTicket(prev => ({ ...prev, comments: [...prev.comments, data] }))
      setComment('')
    } finally { setSending(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'monospace' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title={`TICKET #${id}`} subtitle="carregando..." />
        <div style={{ padding: 60, textAlign: 'center', color: t.textMuted, fontSize: 12 }}>carregando...</div>
      </div>
    </div>
  )

  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '18px 20px', marginBottom: 12 }
  const cardTitle = { fontSize: 9, color: t.textMuted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${t.border}` }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'monospace' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title={`TICKET #${ticket.id}`} subtitle="detalhes do chamado" />
        <div style={{ padding: 24 }}>

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={() => navigate('/tickets')} style={{ background: 'none', border: `1px solid ${t.border}`, color: t.textSecondary, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}>
              ← voltar
            </button>
            {canDelete && (
              <button onClick={handleDelete} style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}>
                🗑 deletar ticket
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, marginBottom: 0 }}>

            {/* Info */}
            <div style={card}>
              <div style={cardTitle}>[ INFORMAÇÕES ]</div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary, marginBottom: 10, letterSpacing: '-0.3px' }}>{ticket.title}</h2>
              <p style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7, marginBottom: 16 }}>{ticket.description}</p>
              {ticket.fileUrl && (
                <a href={`http://localhost:3000${ticket.fileUrl}`} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-block', fontSize: 11, color: '#b8ff57', marginBottom: 16, textDecoration: 'none' }}>
                  📎 ver anexo
                </a>
              )}
              <div style={{ display: 'flex', gap: 24, borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>abertura</span>
                  <span style={{ fontSize: 12, color: t.textSecondary }}>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>aberto por</span>
                  <span style={{ fontSize: 12, color: t.textSecondary }}>{ticket.user.name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>prioridade</span>
                  {canEdit ? (
                    <select value={ticket.priority} onChange={e => handlePriorityChange(e.target.value)}
                      style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 11, color: t.textSecondary, fontFamily: 'monospace', cursor: 'pointer', outline: 'none' }}>
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: PRIORITY[ticket.priority]?.color }}>{PRIORITY[ticket.priority]?.label}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div style={card}>
              <div style={cardTitle}>[ STATUS ]</div>
              <div style={{ display: 'inline-block', fontSize: 11, padding: '6px 14px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 16, background: STATUS[ticket.status]?.bg, color: STATUS[ticket.status]?.color }}>
                {STATUS[ticket.status]?.label}
              </div>
              {canEdit ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>alterar para:</div>
                  {STATUS_OPTIONS.filter(s => s !== ticket.status).map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)} disabled={updating}
                      style={{ padding: '7px 12px', background: 'transparent', borderRadius: 5, fontSize: 11, cursor: 'pointer', textAlign: 'left', letterSpacing: '0.04em', border: `1px solid ${STATUS[s].color}`, color: STATUS[s].color, fontFamily: 'monospace' }}>
                      {STATUS[s].label}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: t.textMuted, fontStyle: 'italic' }}>
                  {dbRole === 'AGENT' ? 'agentes não podem alterar o status' : 'apenas admins podem alterar o status'}
                </p>
              )}
            </div>
          </div>

          {/* Comentários */}
          <div style={{ ...card, marginTop: 0 }}>
            <div style={cardTitle}>[ COMENTÁRIOS ]</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxHeight: 360, overflowY: 'auto' }}>
              {ticket.comments.length === 0 ? (
                <p style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', padding: '20px 0' }}>nenhum comentário ainda</p>
              ) : ticket.comments.map(c => (
                <div key={c.id} style={{ background: c.user.role !== 'CLIENT' ? 'rgba(184,255,87,0.04)' : t.inputBg, border: `1px solid ${c.user.role !== 'CLIENT' ? 'rgba(184,255,87,0.12)' : t.border}`, borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>{c.user.name}</span>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase', background: c.user.role === 'CLIENT' ? t.inputBg : 'rgba(184,255,87,0.1)', color: c.user.role === 'CLIENT' ? t.textMuted : '#b8ff57' }}>
                      {c.user.role === 'CLIENT' ? 'cliente' : c.user.role.toLowerCase()}
                    </span>
                    <span style={{ fontSize: 10, color: t.textMuted, marginLeft: 'auto' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.6 }}>{c.body}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} style={{ display: 'flex', gap: 10, borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} required
                placeholder="Escreva um comentário..."
                style={{ flex: 1, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 12, color: t.textPrimary, fontFamily: 'monospace', outline: 'none', resize: 'vertical' }} />
              <button type="submit" disabled={sending}
                style={{ padding: '0 18px', background: '#b8ff57', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer', alignSelf: 'flex-end', height: 38, fontFamily: 'monospace' }}>
                {sending ? 'enviando...' : 'ENVIAR →'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}