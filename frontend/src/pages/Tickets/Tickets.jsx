import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'

const API = import.meta.env.VITE_API_URL

const STATUS = {
  OPEN:     { label: 'Aberto',       bg: 'rgba(255,77,77,0.1)',   color: '#ff4d4d' },
  DOING:    { label: 'Em andamento', bg: 'rgba(77,159,255,0.1)',  color: '#4d9fff' },
  RESOLVED: { label: 'Resolvido',    bg: 'rgba(184,255,87,0.1)', color: '#b8ff57' },
  CLOSED:   { label: 'Fechado',      bg: '#1a1a1a',               color: '#444'    },
}

const PRIORITY = {
  HIGH:   { label: 'Alta',  color: '#ff4d4d' },
  MEDIUM: { label: 'Média', color: '#ffaa4d' },
  LOW:    { label: 'Baixa', color: '#444'    },
}

export default function Tickets() {
  const navigate = useNavigate()
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
    } catch {
      console.error('Erro ao buscar tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('priority', form.priority)
      if (file) formData.append('file', file)

      await axios.post(`${API}/tickets`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      setForm({ title: '', description: '', priority: 'MEDIUM' })
      setFile(null)
      setShowForm(false)
      fetchTickets()
    } catch {
      setError('Erro ao abrir ticket. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter)

  return (
    <div style={styles.page}>
      <Sidebar />
      <div style={styles.main}>
        <Navbar title="TICKETS" subtitle="seus chamados de suporte" />
        <div style={styles.content}>

          {/* Header */}
          <div style={styles.topRow}>
            <div style={styles.filters}>
              {['ALL', 'OPEN', 'DOING', 'RESOLVED', 'CLOSED'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}>
                  {f === 'ALL' ? 'todos' : STATUS[f]?.label.toLowerCase()}
                </button>
              ))}
            </div>
            <button onClick={() => setShowForm(true)} style={styles.btnNew}>
              + NOVO TICKET
            </button>
          </div>

          {/* Lista */}
          {loading ? (
            <div style={styles.empty}>carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>nenhum ticket encontrado</div>
          ) : (
            <div style={styles.table}>
              <div style={styles.tableHead}>
                <span style={{ width: 60 }}>ID</span>
                <span style={{ flex: 1 }}>Título</span>
                <span style={{ width: 130 }}>Status</span>
                <span style={{ width: 90 }}>Prioridade</span>
                <span style={{ width: 100 }}>Abertura</span>
                <span style={{ width: 60 }}></span>
              </div>
              {filtered.map(t => (
                <div key={t.id} style={styles.tableRow}>
                  <span style={styles.tid}>#{t.id}</span>
                  <span style={styles.ttitle}>{t.title}</span>
                  <span>
                    <span style={{ ...styles.badge, background: STATUS[t.status]?.bg, color: STATUS[t.status]?.color }}>
                      {STATUS[t.status]?.label}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: PRIORITY[t.priority]?.color }}>
                    {PRIORITY[t.priority]?.label}
                  </span>
                  <span style={styles.tdate}>
                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <button onClick={() => navigate(`/tickets/${t.id}`)} style={styles.viewBtn}>
                    ver →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal novo ticket */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHead}>
              <span style={styles.modalTitle}>[ NOVO TICKET ]</span>
              <button onClick={() => setShowForm(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Título</label>
                <input style={styles.input} placeholder="Descreva o problema brevemente"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Descrição</label>
                <textarea style={{ ...styles.input, height: 100, resize: 'vertical' }}
                  placeholder="Detalhe o problema..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Prioridade</label>
                <select style={styles.input} value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Anexo (opcional)</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={e => setFile(e.target.files[0])}
                  style={{ ...styles.input, padding: '6px 10px' }} />
                {file && <span style={styles.fileName}>{file.name}</span>}
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancelar</button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>
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

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: '#0d0d0d', fontFamily: 'monospace' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  content: { padding: 24, flex: 1 },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  filters: { display: 'flex', gap: 6 },
  filterBtn: { padding: '5px 12px', borderRadius: 4, fontSize: 10, background: '#111', border: '1px solid #1a1a1a', color: '#444', cursor: 'pointer', letterSpacing: '0.08em' },
  filterActive: { background: '#b8ff57', border: '1px solid #b8ff57', color: '#0d0d0d' },
  btnNew: { padding: '8px 14px', background: '#b8ff57', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer', letterSpacing: '0.04em' },
  empty: { textAlign: 'center', color: '#333', fontSize: 12, padding: '60px 0' },
  table: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 8 },
  tableHead: { display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #1a1a1a', fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' },
  tableRow: { display: 'flex', gap: 12, padding: '13px 16px', borderBottom: '1px solid #151515', alignItems: 'center', fontSize: 12, transition: 'background 0.12s' },
  tid: { width: 60, color: '#444', flexShrink: 0 },
  ttitle: { flex: 1, color: '#d0d0d0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tdate: { width: 100, color: '#333', fontSize: 11 },
  badge: { fontSize: 9, padding: '3px 8px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 },
  viewBtn: { width: 60, padding: '4px 8px', background: 'none', border: '1px solid #1f1f1f', borderRadius: 4, color: '#888', fontSize: 11, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '24px 28px', width: '100%', maxWidth: 460 },
  modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 14, fontWeight: 800, color: '#f0f0f0' },
  closeBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 9, color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase' },
  input: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, padding: '9px 12px', fontSize: 12, color: '#d0d0d0', fontFamily: 'monospace', outline: 'none', width: '100%' },
  fileName: { fontSize: 10, color: '#b8ff57', marginTop: 4 },
  error: { fontSize: 12, color: '#ff4d4d', textAlign: 'center' },
  modalBtns: { display: 'flex', gap: 8, marginTop: 4 },
  cancelBtn: { flex: 1, padding: '9px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, color: '#444', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' },
  submitBtn: { flex: 1, padding: '9px', background: '#b8ff57', border: 'none', borderRadius: 6, color: '#0d0d0d', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'monospace' },
}