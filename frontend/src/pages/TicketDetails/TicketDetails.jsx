import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import { useThemeColors } from '../../hooks/useThemeColors'
import { useTheme } from '../../contexts/ThemeContext'
import { useMe } from '../../contexts/MeContext'

const API = import.meta.env.VITE_API_URL

const STATUS_OPTIONS = ['OPEN', 'DOING', 'RESOLVED', 'CLOSED']
const STATUS = {
  OPEN:     { label: 'Aberto',       bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', icon: 'ti-clock' },
  DOING:    { label: 'Em andamento', bg: 'rgba(59,130,246,0.1)',  color: '#2563eb', icon: 'ti-loader' },
  RESOLVED: { label: 'Resolvido',    bg: 'rgba(22,163,74,0.1)',   color: '#16a34a', icon: 'ti-circle-check' },
  CLOSED:   { label: 'Fechado',      bg: 'rgba(107,114,128,0.1)', color: '#6b7280', icon: 'ti-lock' },
}
const PRIORITY = {
  HIGH:   { label: 'Alta',  color: '#dc2626', bg: 'rgba(239,68,68,0.08)'   },
  MEDIUM: { label: 'Média', color: '#d97706', bg: 'rgba(217,119,6,0.08)'   },
  LOW:    { label: 'Baixa', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
}

const ROLE_COLOR = {
  SUPERADMIN: { bg: 'rgba(22,163,74,0.1)',  color: '#16a34a' },
  ADMIN:      { bg: 'rgba(59,130,246,0.1)', color: '#2563eb' },
  AGENT:      { bg: 'rgba(217,119,6,0.08)', color: '#d97706' },
  CLIENT:     { bg: 'rgba(107,114,128,0.08)', color: '#6b7280' },
}

export default function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const t = useThemeColors()
  const { dark } = useTheme()
  const { me } = useMe()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  const token = localStorage.getItem('helpdesk_token')
  const headers = { Authorization: `Bearer ${token}` }
  const dbRole   = me?.role
  const canEdit  = ['SUPERADMIN', 'ADMIN'].includes(dbRole)
  const canDelete = dbRole === 'SUPERADMIN'

  useEffect(() => {
    axios.get(`${API}/tickets/${id}`, { headers })
      .then(res => setTicket(res.data))
      .catch(() => navigate('/tickets'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (status) => {
    setUpdating(true)
    try {
      const { data } = await axios.patch(`${API}/tickets/${id}`, { status }, { headers })
      setTicket(p => ({ ...p, status: data.status }))
    } finally { setUpdating(false) }
  }

  const handlePriorityChange = async (priority) => {
    setUpdating(true)
    try {
      const { data } = await axios.patch(`${API}/tickets/${id}`, { priority }, { headers })
      setTicket(p => ({ ...p, priority: data.priority }))
    } finally { setUpdating(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Deletar este ticket permanentemente? Esta ação não pode ser desfeita.')) return
    await axios.delete(`${API}/tickets/${id}`, { headers })
    navigate('/tickets')
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSending(true)
    try {
      const { data } = await axios.post(`${API}/tickets/${id}/comments`, { body: comment }, { headers })
      setTicket(p => ({ ...p, comments: [...p.comments, data] }))
      setComment('')
    } finally { setSending(false) }
  }

  const card = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    padding: '20px 22px',
    marginBottom: 14,
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title={`Ticket #${id}`} subtitle="carregando chamado..." />
        <div style={{ padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ ...card }}>
                <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 20, width: '60%', borderRadius: 4, marginBottom: 16 }} />
                <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 14, width: '100%', borderRadius: 4, marginBottom: 8 }} />
                <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 14, width: '80%', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title={`Ticket #${ticket.id}`} subtitle="detalhes do chamado de suporte" />

        <div className="anim-fade" style={{ padding: 22 }}>

          {/* Barra de ações */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <button onClick={() => navigate('/tickets')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: t.cardBg, border: `1px solid ${t.border}`, color: t.textSecondary, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 15 }} aria-hidden="true" />
              Voltar aos tickets
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {canDelete && (
                <button onClick={handleDelete}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                  <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />
                  Deletar ticket
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>

            {/* Coluna principal */}
            <div>
              {/* Cabeçalho do ticket */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: t.textPrimary, marginBottom: 8, lineHeight: 1.3 }}>{ticket.title}</h2>
                    <p style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.7 }}>{ticket.description}</p>
                  </div>
                </div>

                {ticket.fileUrl && (
                  <a href={`http://localhost:3000${ticket.fileUrl}`} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563eb', padding: '6px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 6, textDecoration: 'none', marginBottom: 16, border: '1px solid rgba(59,130,246,0.2)' }}>
                    <i className="ti ti-paperclip" style={{ fontSize: 14 }} aria-hidden="true" />
                    Ver anexo
                  </a>
                )}

                <div style={{ display: 'flex', gap: 0, borderTop: `1px solid ${t.border}`, paddingTop: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Data de abertura', value: new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), icon: 'ti-calendar' },
                    { label: 'Aberto por', value: ticket.user.name, icon: 'ti-user' },
                  ].map((m, i) => (
                    <div key={m.label} style={{ flex: 1, minWidth: 140, paddingRight: 20, borderRight: i === 0 ? `1px solid ${t.border}` : 'none', marginRight: i === 0 ? 20 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <i className={`ti ${m.icon}`} style={{ fontSize: 12, color: t.textMuted }} aria-hidden="true" />
                        <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 500 }}>{m.label}</span>
                      </div>
                      <span style={{ fontSize: 13, color: t.textPrimary, fontWeight: 500 }}>{m.value}</span>
                    </div>
                  ))}
                  <div style={{ flex: 1, minWidth: 140, paddingLeft: 20, borderLeft: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <i className="ti ti-flag" style={{ fontSize: 12, color: t.textMuted }} aria-hidden="true" />
                      <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 500 }}>Prioridade</span>
                    </div>
                    {canEdit ? (
                      <select value={ticket.priority} onChange={e => handlePriorityChange(e.target.value)}
                        style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 7, padding: '5px 10px', fontSize: 12, color: t.textPrimary, fontFamily: 'system-ui, sans-serif', cursor: 'pointer', outline: 'none' }}>
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, fontWeight: 500, background: PRIORITY[ticket.priority]?.bg, color: PRIORITY[ticket.priority]?.color }}>
                        {PRIORITY[ticket.priority]?.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Comentários */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-message" style={{ fontSize: 16, color: t.textMuted }} aria-hidden="true" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary }}>Comentários</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: dark ? '#1f1f1f' : '#f3f4f6', color: t.textMuted }}>
                      {ticket.comments.length}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 400, overflowY: 'auto' }}>
                  {ticket.comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <i className="ti ti-message-off" style={{ fontSize: 32, color: t.textMuted, display: 'block', marginBottom: 8 }} aria-hidden="true" />
                      <p style={{ fontSize: 13, color: t.textMuted }}>Nenhum comentário ainda</p>
                      <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Seja o primeiro a comentar neste ticket</p>
                    </div>
                  ) : ticket.comments.map((c, i) => {
                    const isAgent = c.user.role !== 'CLIENT'
                    const roleStyle = ROLE_COLOR[c.user.role] || ROLE_COLOR.CLIENT
                    return (
                      <div key={c.id} className={`anim-fade anim-d${Math.min(i+1,5)}`}
                        style={{ background: isAgent ? (dark ? 'rgba(22,163,74,0.06)' : '#f0fdf4') : t.inputBg, border: `1px solid ${isAgent ? (dark ? 'rgba(22,163,74,0.15)' : '#bbf7d0') : t.border}`, borderRadius: 9, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: roleStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: roleStyle.color, flexShrink: 0 }}>
                            {c.user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, color: t.textPrimary, fontWeight: 600 }}>{c.user.name}</span>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, marginLeft: 8, background: roleStyle.bg, color: roleStyle.color, fontWeight: 500 }}>
                              {c.user.role === 'CLIENT' ? 'Cliente' : c.user.role === 'AGENT' ? 'Agente' : c.user.role === 'ADMIN' ? 'Admin' : 'Superadmin'}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: t.textMuted }}>
                            {new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.6, margin: 0 }}>{c.body}</p>
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={handleComment} style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} required
                    placeholder="Escreva um comentário..."
                    style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: t.textPrimary, fontFamily: 'system-ui, sans-serif', outline: 'none', resize: 'vertical', marginBottom: 10 }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={sending}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#16a34a', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                      <i className="ti ti-send" style={{ fontSize: 14 }} aria-hidden="true" />
                      {sending ? 'Enviando...' : 'Enviar comentário'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Coluna lateral */}
            <div>
              {/* Status */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${t.border}` }}>
                  <i className="ti ti-info-circle" style={{ fontSize: 15, color: t.textMuted }} aria-hidden="true" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>Status do ticket</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: STATUS[ticket.status]?.bg, marginBottom: 16 }}>
                  <i className={`ti ${STATUS[ticket.status]?.icon}`} style={{ fontSize: 16, color: STATUS[ticket.status]?.color }} aria-hidden="true" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: STATUS[ticket.status]?.color }}>{STATUS[ticket.status]?.label}</span>
                </div>

                {canEdit ? (
                  <div>
                    <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 8 }}>Alterar status para:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {STATUS_OPTIONS.filter(s => s !== ticket.status).map(s => (
                        <button key={s} onClick={() => handleStatusChange(s)} disabled={updating}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'transparent', borderRadius: 8, fontSize: 13, cursor: 'pointer', textAlign: 'left', border: `1px solid ${STATUS[s].color}`, color: STATUS[s].color, transition: 'all 0.12s', opacity: updating ? 0.5 : 1 }}
                          onMouseEnter={e => e.currentTarget.style.background = STATUS[s].bg}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <i className={`ti ${STATUS[s].icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
                          {STATUS[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: dark ? '#1a1a1a' : '#f9fafb', borderRadius: 8, border: `1px solid ${t.border}` }}>
                    <i className="ti ti-lock" style={{ fontSize: 14, color: t.textMuted }} aria-hidden="true" />
                    <span style={{ fontSize: 12, color: t.textMuted }}>
                      {dbRole === 'AGENT' ? 'Agentes não podem alterar o status' : 'Apenas admins podem alterar o status'}
                    </span>
                  </div>
                )}
              </div>

              {/* Informações rápidas */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${t.border}` }}>
                  <i className="ti ti-list-details" style={{ fontSize: 15, color: t.textMuted }} aria-hidden="true" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>Detalhes</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 4 }}>Prioridade</div>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, fontWeight: 500, background: PRIORITY[ticket.priority]?.bg, color: PRIORITY[ticket.priority]?.color }}>
                      {PRIORITY[ticket.priority]?.label}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 4 }}>Abertura</div>
                    <div style={{ fontSize: 13, color: t.textPrimary }}>
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 4 }}>Solicitante</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#374151' }}>
                        {ticket.user.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, color: t.textPrimary, fontWeight: 500 }}>{ticket.user.name}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 4 }}>ID do ticket</div>
                    <div style={{ fontSize: 13, color: t.textPrimary, fontFamily: 'monospace' }}>#{ticket.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 4 }}>Comentários</div>
                    <div style={{ fontSize: 13, color: t.textPrimary }}>{ticket.comments.length} comentário{ticket.comments.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}