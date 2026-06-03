import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import { useThemeColors } from '../../hooks/useThemeColors'
import { useTheme } from '../../contexts/ThemeContext'

const API = import.meta.env.VITE_API_URL

const STATUS = {
  OPEN:     { label: 'Aberto',       bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  DOING:    { label: 'Em andamento', bg: 'rgba(59,130,246,0.1)',  color: '#2563eb' },
  RESOLVED: { label: 'Resolvido',    bg: 'rgba(22,163,74,0.1)',   color: '#16a34a' },
  CLOSED:   { label: 'Fechado',      bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
}
const PRIORITY = {
  HIGH:   { label: 'Alta',  color: '#dc2626', bg: 'rgba(239,68,68,0.08)'   },
  MEDIUM: { label: 'Média', color: '#d97706', bg: 'rgba(217,119,6,0.08)'   },
  LOW:    { label: 'Baixa', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
}

const FILTERS = [
  { key: 'ALL',      label: 'Todos'         },
  { key: 'OPEN',     label: 'Abertos'       },
  { key: 'DOING',    label: 'Em andamento'  },
  { key: 'RESOLVED', label: 'Resolvidos'    },
  { key: 'CLOSED',   label: 'Fechados'      },
]

export default function Tickets() {
  const navigate = useNavigate()
  const t = useThemeColors()
  const { dark } = useTheme()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('helpdesk_token')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchTickets = async () => {
    try { const { data } = await axios.get(`${API}/tickets`, { headers }); setTickets(data) }
    catch { console.error('Erro ao buscar tickets') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('priority', form.priority)
      if (file) fd.append('file', file)
      await axios.post(`${API}/tickets`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } })
      setForm({ title: '', description: '', priority: 'MEDIUM' })
      setFile(null); setShowForm(false); fetchTickets()
    } catch { setError('Erro ao abrir ticket. Tente novamente.') }
    finally { setSubmitting(false) }
  }

  const filtered = tickets
    .filter(tk => filter === 'ALL' || tk.status === filter)
    .filter(tk => !search || tk.title.toLowerCase().includes(search.toLowerCase()))

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter(t => t.status === 'OPEN').length,
    DOING: tickets.filter(t => t.status === 'DOING').length,
    RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
    CLOSED: tickets.filter(t => t.status === 'CLOSED').length,
  }

  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 10 }
  const inp  = { background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: t.textPrimary, fontFamily: 'system-ui, sans-serif', outline: 'none', width: '100%' }
  const lbl  = { fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 5, display: 'block' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title="Tickets" subtitle="gerenciamento de chamados de suporte" />

        <div className="anim-fade" style={{ padding: 22, flex: 1 }}>

          {/* Cards de contagem rápida */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: '12px 14px', borderRadius: 9, border: `1.5px solid ${filter === f.key ? '#16a34a' : t.border}`, background: filter === f.key ? (dark ? 'rgba(22,163,74,0.12)' : '#f0fdf4') : t.cardBg, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: filter === f.key ? '#16a34a' : t.textPrimary }}>
                  {loading ? '—' : counts[f.key]}
                </div>
                <div style={{ fontSize: 11, color: filter === f.key ? '#16a34a' : t.textMuted, marginTop: 3 }}>{f.label}</div>
              </button>
            ))}
          </div>

          {/* Barra de ações */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', width: 260 }}>
              <i className="ti ti-search" style={{ fontSize: 15, color: t.textMuted }} aria-hidden="true" />
              <input
                placeholder="Buscar tickets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: t.textPrimary, flex: 1, fontFamily: 'system-ui, sans-serif' }}
              />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>}
            </div>
            <button onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#16a34a', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              <i className="ti ti-plus" style={{ fontSize: 15 }} aria-hidden="true" />
              Novo Ticket
            </button>
          </div>

          {/* Tabela */}
          {loading ? (
            <div style={card}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 150px 110px 110px 80px', gap: 12, padding: '16px', borderBottom: `1px solid ${t.borderLight}`, alignItems: 'center' }}>
                  {[40,220,80,60,70,50].map((w,j) => (
                    <div key={j} className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 13, width: w, borderRadius: 4, animationDelay: `${j*0.06}s` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...card, padding: '60px 0', textAlign: 'center' }}>
              <i className="ti ti-ticket-off" style={{ fontSize: 36, color: t.textMuted, display: 'block', marginBottom: 12 }} aria-hidden="true" />
              <div style={{ fontSize: 14, color: t.textMuted }}>Nenhum ticket encontrado</div>
              {search && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Tente uma busca diferente</div>}
            </div>
          ) : (
            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 150px 110px 110px 80px', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, fontSize: 11, color: t.textMuted, fontWeight: 500, background: dark ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderRadius: '10px 10px 0 0' }}>
                <span>ID</span><span>Título</span><span>Status</span><span>Prioridade</span><span>Abertura</span><span></span>
              </div>
              {filtered.map((tk, i) => (
                <div key={tk.id} className={`anim-fade anim-d${Math.min(i+1,5)}`}
                  style={{ display: 'grid', gridTemplateColumns: '70px 1fr 150px 110px 110px 80px', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${t.borderLight}`, alignItems: 'center', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>#{tk.id}</span>

                  <div>
                    <div style={{ color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>{tk.title}</div>
                    {tk.description && (
                      <div style={{ fontSize: 11, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{tk.description}</div>
                    )}
                  </div>

                  <span>
                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, fontWeight: 500, background: STATUS[tk.status]?.bg, color: STATUS[tk.status]?.color }}>
                      {STATUS[tk.status]?.label}
                    </span>
                  </span>

                  <span>
                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, fontWeight: 500, background: PRIORITY[tk.priority]?.bg, color: PRIORITY[tk.priority]?.color }}>
                      {PRIORITY[tk.priority]?.label}
                    </span>
                  </span>

                  <span style={{ fontSize: 12, color: t.textMuted }}>{new Date(tk.createdAt).toLocaleDateString('pt-BR')}</span>

                  <button onClick={() => navigate(`/tickets/${tk.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: dark ? 'rgba(22,163,74,0.1)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}`, borderRadius: 7, color: '#16a34a', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    Ver <i className="ti ti-arrow-right" style={{ fontSize: 13 }} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal novo ticket */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="anim-scale" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '24px 28px', width: '100%', maxWidth: 480 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary }}>Abrir novo ticket</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Descreva o problema para nossa equipe</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Título do chamado</label>
                <input style={inp} placeholder="Ex: Elevador parado no 3º andar" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div>
                <label style={lbl}>Descrição detalhada</label>
                <textarea style={{ ...inp, height: 100, resize: 'vertical' }} placeholder="Descreva o problema com mais detalhes, local, horário..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>
              <div>
                <label style={lbl}>Nível de prioridade</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { value: 'LOW',    label: 'Baixa',  desc: 'Não urgente',  color: '#6b7280' },
                    { value: 'MEDIUM', label: 'Média',  desc: 'Moderado',     color: '#d97706' },
                    { value: 'HIGH',   label: 'Alta',   desc: 'Urgente',      color: '#dc2626' },
                  ].map(p => (
                    <button key={p.value} type="button" onClick={() => setForm({...form, priority: p.value})}
                      style={{ padding: '10px', borderRadius: 8, border: `1.5px solid ${form.priority === p.value ? p.color : t.border}`, background: form.priority === p.value ? `${p.color}15` : t.inputBg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.12s' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: form.priority === p.value ? p.color : t.textPrimary }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Anexo (opcional)</label>
                <div style={{ border: `1.5px dashed ${t.border}`, borderRadius: 8, padding: '14px', textAlign: 'center', cursor: 'pointer', background: t.inputBg }}>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} id="file-upload" />
                  <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                    {file ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <i className="ti ti-file" style={{ fontSize: 16, color: '#16a34a' }} aria-hidden="true" />
                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>{file.name}</span>
                        <button type="button" onClick={e => { e.preventDefault(); setFile(null) }} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 14 }}>✕</button>
                      </div>
                    ) : (
                      <div>
                        <i className="ti ti-upload" style={{ fontSize: 20, color: t.textMuted, display: 'block', marginBottom: 4 }} aria-hidden="true" />
                        <span style={{ fontSize: 12, color: t.textMuted }}>Clique para anexar arquivo</span>
                        <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>JPG, PNG, PDF, DOC — máx. 5MB</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              {error && <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textSecondary, fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '10px', background: '#16a34a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {submitting ? 'Abrindo...' : 'Abrir Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}