import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import { useAuth } from '../../contexts/AuthContext'

const API = import.meta.env.VITE_API_URL

const STATUS_OPTIONS = ['OPEN', 'DOING', 'RESOLVED', 'CLOSED']
const STATUS = {
  OPEN:     { label: 'Aberto',       bg: 'rgba(255,77,77,0.1)',  color: '#ff4d4d' },
  DOING:    { label: 'Em andamento', bg: 'rgba(77,159,255,0.1)', color: '#4d9fff' },
  RESOLVED: { label: 'Resolvido',    bg: 'rgba(184,255,87,0.1)', color: '#b8ff57' },
  CLOSED:   { label: 'Fechado',      bg: '#1a1a1a',              color: '#444'    },
}
const PRIORITY = {
  HIGH:   { label: 'Alta',  color: '#ff4d4d' },
  MEDIUM: { label: 'Média', color: '#ffaa4d' },
  LOW:    { label: 'Baixa', color: '#444'    },
}

export default function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [dbRole, setDbRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  const token = localStorage.getItem('helpdesk_token')
  const headers = { Authorization: `Bearer ${token}` }

  // Permissões baseadas no role do banco
  const canEdit   = ['SUPERADMIN', 'ADMIN'].includes(dbRole)
  const canDelete = dbRole === 'SUPERADMIN'

  const fetchTicket = async () => {
    try {
      // Busca o ticket e o role do usuário no banco ao mesmo tempo
      const [ticketRes, meRes] = await Promise.all([
        axios.get(`${API}/tickets/${id}`, { headers }),
        axios.get(`${API}/auth/me`, { headers }),
      ])
      setTicket(ticketRes.data)
      setDbRole(meRes.data.role)
    } catch {
      navigate('/tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTicket() }, [id])

  const handleStatusChange = async (status) => {
    setUpdating(true)
    try {
      const { data } = await axios.patch(`${API}/tickets/${id}`, { status }, { headers })
      setTicket(prev => ({ ...prev, status: data.status }))
    } catch {
      console.error('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (priority) => {
    setUpdating(true)
    try {
      const { data } = await axios.patch(`${API}/tickets/${id}`, { priority }, { headers })
      setTicket(prev => ({ ...prev, priority: data.priority }))
    } catch {
      console.error('Erro ao atualizar prioridade')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Deletar este ticket permanentemente?')) return
    try {
      await axios.delete(`${API}/tickets/${id}`, { headers })
      navigate('/tickets')
    } catch {
      console.error('Erro ao deletar ticket')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSending(true)
    try {
      const { data } = await axios.post(`${API}/tickets/${id}/comments`, { body: comment }, { headers })
      setTicket(prev => ({ ...prev, comments: [...prev.comments, data] }))
      setComment('')
    } catch {
      console.error('Erro ao enviar comentário')
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div style={styles.page}>
      <Sidebar />
      <div style={styles.main}>
        <Navbar title={`TICKET #${id}`} subtitle="carregando..." />
        <div style={styles.loading}>carregando...</div>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <Sidebar />
      <div style={styles.main}>
        <Navbar title={`TICKET #${ticket.id}`} subtitle="detalhes do chamado" />
        <div style={styles.content}>

          <div style={styles.topRow}>
            <button onClick={() => navigate('/tickets')} style={styles.backBtn}>
              ← voltar
            </button>
            {canDelete && (
              <button onClick={handleDelete} style={styles.deleteBtn}>
                🗑 deletar ticket
              </button>
            )}
          </div>

          <div style={styles.grid}>

            {/* Info principal */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>[ INFORMAÇÕES ]</div>
              <h2 style={styles.ticketTitle}>{ticket.title}</h2>
              <p style={styles.ticketDesc}>{ticket.description}</p>

              {ticket.fileUrl && (
                <a href={`http://localhost:3000${ticket.fileUrl}`} target="_blank" rel="noreferrer" style={styles.fileLink}>
                  📎 ver anexo
                </a>
              )}

              <div style={styles.metaRow}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>abertura</span>
                  <span style={styles.metaValue}>
                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>aberto por</span>
                  <span style={styles.metaValue}>{ticket.user.name}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>prioridade</span>
                  {canEdit ? (
                    <select
                      value={ticket.priority}
                      onChange={e => handlePriorityChange(e.target.value)}
                      style={styles.prioSelect}>
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  ) : (
                    <span style={{ ...styles.metaValue, color: PRIORITY[ticket.priority]?.color }}>
                      {PRIORITY[ticket.priority]?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>[ STATUS ]</div>
              <div style={{ ...styles.statusBadge, background: STATUS[ticket.status]?.bg, color: STATUS[ticket.status]?.color }}>
                {STATUS[ticket.status]?.label}
              </div>

              {canEdit ? (
                <div style={styles.statusBtns}>
                  <div style={styles.statusLabel}>alterar para:</div>
                  {STATUS_OPTIONS.filter(s => s !== ticket.status).map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      disabled={updating}
                      style={{ ...styles.statusBtn, color: STATUS[s].color, borderColor: STATUS[s].color }}>
                      {STATUS[s].label}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={styles.noEdit}>
                  {dbRole === 'AGENT'
                    ? 'agentes não podem alterar o status'
                    : 'apenas admins podem alterar o status'}
                </p>
              )}
            </div>
          </div>

          {/* Comentários */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>[ COMENTÁRIOS ]</div>

            <div style={styles.comments}>
              {ticket.comments.length === 0 ? (
                <p style={styles.noComments}>nenhum comentário ainda</p>
              ) : (
                ticket.comments.map(c => (
                  <div key={c.id} style={{
                    ...styles.comment,
                    ...(c.user.role !== 'CLIENT' ? styles.commentAgent : {})
                  }}>
                    <div style={styles.commentHead}>
                      <span style={styles.commentAuthor}>{c.user.name}</span>
                      <span style={{
                        ...styles.commentRoleBadge,
                        background: c.user.role === 'CLIENT' ? '#1a1a1a' : 'rgba(184,255,87,0.08)',
                        color: c.user.role === 'CLIENT' ? '#444' : '#b8ff57',
                      }}>
                        {c.user.role === 'CLIENT' ? 'cliente' : c.user.role.toLowerCase()}
                      </span>
                      <span style={styles.commentTime}>
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p style={styles.commentBody}>{c.body}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleComment} style={styles.commentForm}>
              <textarea
                style={styles.commentInput}
                placeholder="Escreva um comentário..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                required
              />
              <button type="submit" style={styles.commentBtn} disabled={sending}>
                {sending ? 'enviando...' : 'ENVIAR →'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: '#0d0d0d', fontFamily: 'monospace' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  content: { padding: 24 },
  loading: { padding: 60, textAlign: 'center', color: '#333', fontSize: 12 },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { background: 'none', border: '1px solid #1f1f1f', color: '#888', borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer' },
  deleteBtn: { background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, marginBottom: 12 },
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 8, padding: '18px 20px', marginBottom: 12 },
  cardTitle: { fontSize: 9, color: '#444', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #1a1a1a' },
  ticketTitle: { fontSize: 16, fontWeight: 800, color: '#f0f0f0', marginBottom: 10, letterSpacing: '-0.3px' },
  ticketDesc: { fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 16 },
  fileLink: { display: 'inline-block', fontSize: 11, color: '#b8ff57', marginBottom: 16, textDecoration: 'none' },
  metaRow: { display: 'flex', gap: 24, borderTop: '1px solid #1a1a1a', paddingTop: 14 },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 5 },
  metaLabel: { fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' },
  metaValue: { fontSize: 12, color: '#888' },
  prioSelect: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 4, padding: '4px 8px', fontSize: 11, color: '#888', fontFamily: 'monospace', cursor: 'pointer', outline: 'none' },
  statusBadge: { display: 'inline-block', fontSize: 11, padding: '6px 14px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 16 },
  statusBtns: { display: 'flex', flexDirection: 'column', gap: 6 },
  statusLabel: { fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 },
  statusBtn: { padding: '7px 12px', background: 'transparent', borderRadius: 5, fontSize: 11, cursor: 'pointer', textAlign: 'left', letterSpacing: '0.04em', border: '1px solid', transition: 'opacity 0.12s' },
  noEdit: { fontSize: 11, color: '#333', fontStyle: 'italic' },
  comments: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxHeight: 360, overflowY: 'auto' },
  noComments: { fontSize: 12, color: '#333', textAlign: 'center', padding: '20px 0' },
  comment: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, padding: '12px 14px' },
  commentAgent: { background: 'rgba(184,255,87,0.03)', border: '1px solid rgba(184,255,87,0.08)' },
  commentHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  commentAuthor: { fontSize: 12, color: '#888', fontWeight: 500 },
  commentRoleBadge: { fontSize: 9, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase' },
  commentTime: { fontSize: 10, color: '#252525', marginLeft: 'auto' },
  commentBody: { fontSize: 12, color: '#555', lineHeight: 1.6 },
  commentForm: { display: 'flex', gap: 10, borderTop: '1px solid #1a1a1a', paddingTop: 14 },
  commentInput: { flex: 1, background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#d0d0d0', fontFamily: 'monospace', outline: 'none', resize: 'vertical' },
  commentBtn: { padding: '0 18px', background: '#b8ff57', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer', alignSelf: 'flex-end', height: 38 },
}