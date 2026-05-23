import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import { useAuth } from '../../contexts/AuthContext'

const API = import.meta.env.VITE_API_URL

const ROLE_STYLE = {
  SUPERADMIN: { bg: 'rgba(184,255,87,0.1)', color: '#b8ff57' },
  ADMIN:      { bg: 'rgba(77,159,255,0.1)', color: '#4d9fff' },
  AGENT:      { bg: 'rgba(255,170,77,0.1)', color: '#ffaa4d' },
  CLIENT:     { bg: '#1a1a1a',              color: '#444'    },
}

export default function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isSuperAdmin = user?.app_metadata?.role === 'SUPERADMIN' ||
    users.find(u => u.email === user?.email)?.role === 'SUPERADMIN'

  const token = localStorage.getItem('helpdesk_token')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/users`, { headers })
      setUsers(data)
    } catch {
      console.error('Erro ao buscar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await axios.post(`${API}/users`, form, { headers })
      setForm({ name: '', email: '', password: '', role: 'AGENT' })
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar usuário')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await axios.patch(`${API}/users/${id}`, { role }, { headers })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao atualizar role')
    }
  }

  const handleToggleActive = async (id, active) => {
    try {
      await axios.patch(`${API}/users/${id}`, { active: !active }, { headers })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Sem permissão')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return
    try {
      await axios.delete(`${API}/users/${id}`, { headers })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Sem permissão para deletar')
    }
  }

  const myRole = users.find(u => u.email === user?.email)?.role

  return (
    <div style={styles.page}>
      <Sidebar />
      <div style={styles.main}>
        <Navbar title="USUÁRIOS" subtitle="gestão de acessos" />
        <div style={styles.content}>

          <div style={styles.topRow}>
            <div style={styles.summary}>
              <span style={styles.summaryItem}>{users.length} total</span>
              <span style={styles.summaryItem}>{users.filter(u => u.active).length} ativos</span>
              <span style={styles.summaryItem}>{users.filter(u => u.role === 'AGENT').length} agentes</span>
              <span style={styles.summaryItem}>{users.filter(u => u.role === 'ADMIN').length} admins</span>
            </div>
            {myRole === 'SUPERADMIN' && (
              <button onClick={() => setShowForm(true)} style={styles.btnNew}>
                + NOVO USUÁRIO
              </button>
            )}
          </div>

          {loading ? (
            <div style={styles.empty}>carregando...</div>
          ) : (
            <div style={styles.table}>
              <div style={styles.tableHead}>
                <span style={{ flex: 1 }}>Nome</span>
                <span style={{ width: 190 }}>Email</span>
                <span style={{ width: 120 }}>Role</span>
                <span style={{ width: 80 }}>Status</span>
                <span style={{ width: 100 }}>Desde</span>
                <span style={{ width: 100 }}>Ações</span>
              </div>

              {users.map(u => (
                <div key={u.id} style={{ ...styles.tableRow, opacity: u.active ? 1 : 0.45 }}>
                  <span style={{ flex: 1, color: '#d0d0d0', fontSize: 12 }}>{u.name}</span>
                  <span style={{ width: 190, color: '#444', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email}
                  </span>

                  {/* Role */}
                  <span style={{ width: 120 }}>
                    {u.role === 'SUPERADMIN' || myRole !== 'SUPERADMIN' ? (
                      <span style={{ ...styles.badge, ...ROLE_STYLE[u.role] }}>
                        {u.role}
                      </span>
                    ) : (
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={styles.roleSelect}>
                        <option value="ADMIN">ADMIN</option>
                        <option value="AGENT">AGENT</option>
                        <option value="CLIENT">CLIENT</option>
                      </select>
                    )}
                  </span>

                  {/* Status ativo/inativo */}
                  <span style={{ width: 80 }}>
                    {u.role !== 'SUPERADMIN' && myRole === 'SUPERADMIN' ? (
                      <button onClick={() => handleToggleActive(u.id, u.active)}
                        style={{ ...styles.toggleBtn, color: u.active ? '#b8ff57' : '#444', borderColor: u.active ? '#b8ff57' : '#333' }}>
                        {u.active ? 'ativo' : 'inativo'}
                      </button>
                    ) : (
                      <span style={{ ...styles.badge, ...ROLE_STYLE[u.role], opacity: 0.5 }}>
                        {u.active ? 'ativo' : 'inativo'}
                      </span>
                    )}
                  </span>

                  {/* Data */}
                  <span style={{ width: 100, color: '#333', fontSize: 11 }}>
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </span>

                  {/* Deletar — só SUPERADMIN */}
                  <span style={{ width: 100 }}>
                    {u.role !== 'SUPERADMIN' && myRole === 'SUPERADMIN' && (
                      <button onClick={() => handleDelete(u.id)} style={styles.deleteBtn}>
                        deletar
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal criar usuário — só SUPERADMIN vê */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHead}>
              <span style={styles.modalTitle}>[ NOVO USUÁRIO ]</span>
              <button onClick={() => setShowForm(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Nome completo</label>
                <input style={styles.input} placeholder="Ex: João Silva"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email corporativo</label>
                <input type="email" style={styles.input} placeholder="joao@empresa.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Senha provisória</label>
                <input type="password" style={styles.input} placeholder="mínimo 6 caracteres"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Função</label>
                <select style={styles.input} value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="AGENT">Agente — vê todos os tickets, comenta, não edita</option>
                  <option value="ADMIN">Admin — vê e edita todos os tickets</option>
                  <option value="CLIENT">Cliente — abre e comenta nos próprios tickets</option>
                </select>
              </div>

              {/* Card explicativo das permissões */}
              <div style={styles.permBox}>
                <p style={styles.permTitle}>permissões da função selecionada</p>
                {form.role === 'AGENT' && (
                  <ul style={styles.permList}>
                    <li style={styles.permItem}>✅ Ver todos os tickets abertos</li>
                    <li style={styles.permItem}>✅ Comentar em qualquer ticket</li>
                    <li style={styles.permItem}>✅ Abrir ticket próprio</li>
                    <li style={styles.permItem}>❌ Mudar status ou prioridade</li>
                    <li style={styles.permItem}>❌ Criar ou deletar usuários</li>
                  </ul>
                )}
                {form.role === 'ADMIN' && (
                  <ul style={styles.permList}>
                    <li style={styles.permItem}>✅ Ver todos os tickets</li>
                    <li style={styles.permItem}>✅ Mudar status e prioridade</li>
                    <li style={styles.permItem}>✅ Comentar em qualquer ticket</li>
                    <li style={styles.permItem}>✅ Abrir ticket próprio</li>
                    <li style={styles.permItem}>❌ Criar ou deletar usuários</li>
                    <li style={styles.permItem}>❌ Deletar tickets</li>
                  </ul>
                )}
                {form.role === 'CLIENT' && (
                  <ul style={styles.permList}>
                    <li style={styles.permItem}>✅ Abrir ticket</li>
                    <li style={styles.permItem}>✅ Comentar nos próprios tickets</li>
                    <li style={styles.permItem}>❌ Ver tickets de outros</li>
                    <li style={styles.permItem}>❌ Mudar status ou prioridade</li>
                  </ul>
                )}
              </div>

              {error && <p style={styles.error}>{error}</p>}
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Criando...' : 'CRIAR USUÁRIO →'}
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
  content: { padding: 24 },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  summary: { display: 'flex', gap: 20 },
  summaryItem: { fontSize: 11, color: '#444', letterSpacing: '0.08em' },
  btnNew: { padding: '8px 14px', background: '#b8ff57', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#333', fontSize: 12, padding: '60px 0' },
  table: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 8 },
  tableHead: { display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #1a1a1a', fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' },
  tableRow: { display: 'flex', gap: 12, padding: '13px 16px', borderBottom: '1px solid #151515', alignItems: 'center' },
  badge: { fontSize: 9, padding: '3px 8px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 },
  roleSelect: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 4, padding: '4px 8px', fontSize: 10, color: '#888', fontFamily: 'monospace', cursor: 'pointer', outline: 'none' },
  toggleBtn: { padding: '3px 10px', background: 'transparent', borderRadius: 4, fontSize: 9, cursor: 'pointer', border: '1px solid', letterSpacing: '0.08em', textTransform: 'uppercase' },
  deleteBtn: { padding: '4px 10px', background: 'transparent', border: '1px solid #ff4d4d', borderRadius: 4, color: '#ff4d4d', fontSize: 10, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '24px 28px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' },
  modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 14, fontWeight: 800, color: '#f0f0f0' },
  closeBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 9, color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase' },
  input: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, padding: '9px 12px', fontSize: 12, color: '#d0d0d0', fontFamily: 'monospace', outline: 'none' },
  permBox: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 6, padding: '12px 14px' },
  permTitle: { fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 },
  permList: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 },
  permItem: { fontSize: 11, color: '#555' },
  error: { fontSize: 12, color: '#ff4d4d', textAlign: 'center' },
  modalBtns: { display: 'flex', gap: 8, marginTop: 4 },
  cancelBtn: { flex: 1, padding: '9px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, color: '#444', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' },
  submitBtn: { flex: 1, padding: '9px', background: '#b8ff57', border: 'none', borderRadius: 6, color: '#0d0d0d', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'monospace' },
}