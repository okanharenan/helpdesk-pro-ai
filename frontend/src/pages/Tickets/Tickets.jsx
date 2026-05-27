import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import { useThemeColors } from '../../hooks/useThemeColors'

const API = import.meta.env.VITE_API_URL

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

export default function Tickets() {
  const navigate = useNavigate()
  const t = useThemeColors()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('helpdesk_token')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchTickets = async () => {
    try {
      const { data } = await axios.get(`${API}/tickets`, { headers })
      setTickets(data)
    } catch { console.error('Erro ao buscar tickets') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('priority', form.priority)
      if (file) fd.append('file', file)
      await axios.post(`${API}/tickets`, fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      setForm({ title: '', description: '', priority: 'MEDIUM' })
      setFile(null)
      setShowForm(false)
      fetchTickets()
    } catch { setError('Erro ao abrir ticket. Tente novamente.') }
    finally { setSubmitting(false) }
  }

  const filtered = filter === 'ALL' ? tickets : tickets.filter(tk => tk.status === filter)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'monospace' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title="TICKETS" subtitle="chamados de suporte" />
        <div style={{ padding: 24, flex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'OPEN', 'DOING', 'RESOLVED', 'CLOSED'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 12px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                  letterSpacing: '0.08em', fontFamily: 'monospace',
                  background: filter === f ? '#b8ff57' : t.cardBg,
                  border: `1px solid ${filter === f ? '#b8ff57' : t.border}`,
                  color: filter === f ? '#0d0d0d' : t.textMuted,
                }}>
                  {f === 'ALL' ? 'todos' : STATUS[f]?.label.toLowerCase()}
                </button>
              ))}
            </div>
            <button onClick={() => setShowForm(true)} style={{
              padding: '8px 14px', background: '#b8ff57', border: 'none',
              borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer',
            }}>
              + NOVO TICKET
            </button>
          </div>

          {/* Tabela */}
          {loading ? (
            <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 12, padding: '60px 0' }}>carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 12, padding: '60px 0' }}>nenhum ticket encontrado</div>
          ) : (
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, fontSize: 9, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', background: t.tableHead, borderRadius: '8px 8px 0 0' }}>
                <span style={{ width: 60 }}>ID</span>
                <span style={{ flex: 1 }}>Título</span>
                <span style={{ width: 130 }}>Status</span>
                <span style={{ width: 90 }}>Prioridade</span>
                <span style={{ width: 100 }}>Abertura</span>
                <span style={{ width: 60 }}></span>
              </div>
              {filtered.map(tk => (
                <div key={tk.id} style={{ display: 'flex', gap: 12, padding: '13px 16px', borderBottom: `1px solid ${t.borderLight}`, alignItems: 'center', fontSize: 12 }}>
                  <span style={{ width: 60, color: t.textMuted, flexShrink: 0, fontSize: 11 }}>#{tk.id}</span>
                  <span style={{ flex: 1, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.title}</span>
                  <span style={{ width: 130 }}>
                    <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, background: STATUS[tk.status]?.bg, color: STATUS[tk.status]?.color }}>
                      {STATUS[tk.status]?.label}
                    </span>
                  </span>
                  <span style={{ width: 90, fontSize: 12, color: PRIORITY[tk.priority]?.color }}>{PRIORITY[tk.priority]?.label}</span>
                  <span style={{ width: 100, color: t.textMuted, fontSize: 11 }}>{new Date(tk.createdAt).toLocaleDateString('pt-BR')}</span>
                  <button onClick={() => navigate(`/tickets/${tk.id}`)} style={{ width: 60, padding: '4px 8px', background: 'none', border: `1px solid ${t.border}`, borderRadius: 4, color: t.textSecondary, fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}>
                    ver →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '24px 28px', width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: t.textPrimary }}>[ NOVO TICKET ]</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Título', key: 'title', placeholder: 'Descreva o problema brevemente', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{f.label}</label>
                  <input style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '9px 12px', fontSize: 12, color: t.textPrimary, fontFamily: 'monospace', outline: 'none' }}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Descrição</label>
                <textarea style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '9px 12px', fontSize: 12, color: t.textPrimary, fontFamily: 'monospace', outline: 'none', height: 100, resize: 'vertical' }}
                  placeholder="Detalhe o problema..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Prioridade</label>
                <select style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '9px 12px', fontSize: 12, color: t.textPrimary, fontFamily: 'monospace', outline: 'none' }}
                  value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Anexo (opcional)</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={e => setFile(e.target.files[0])}
                  style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: t.textPrimary, fontFamily: 'monospace', outline: 'none' }} />
                {file && <span style={{ fontSize: 10, color: '#b8ff57', marginTop: 2 }}>{file.name}</span>}
              </div>
              {error && <p style={{ fontSize: 12, color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.textSecondary, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '9px', background: '#b8ff57', border: 'none', borderRadius: 6, color: '#0d0d0d', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'monospace' }} disabled={submitting}>
                  {submitting ? 'Abrindo...' : 'ABRIR TICKET →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}