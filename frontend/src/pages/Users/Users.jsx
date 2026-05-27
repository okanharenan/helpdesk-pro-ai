import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import { useThemeColors } from '../../hooks/useThemeColors'

const API = import.meta.env.VITE_API_URL

const ROLE_STYLE = {
  SUPERADMIN: { bg: 'rgba(184,255,87,0.12)', color: '#7acc00' },
  ADMIN:      { bg: 'rgba(77,159,255,0.12)', color: '#4d9fff' },
  AGENT:      { bg: 'rgba(255,170,77,0.12)', color: '#ffaa4d' },
  CLIENT:     { bg: 'rgba(120,120,120,0.1)', color: '#888888' },
}

export default function Users() {
  const t = useThemeColors()
  const [users, setUsers] = useState([])
  const [myRole, setMyRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('helpdesk_token')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = async () => {
    try {
      const [usersRes, meRes] = await Promise.all([
        axios.get(`${API}/users`, { headers }),
        axios.get(`${API}/auth/me`, { headers }),
      ])
      setUsers(usersRes.data)
      setMyRole(meRes.data.role)
    } catch { console.error('Erro ao buscar dados') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await axios.post(`${API}/users`, form, { headers })
      setForm({ name: '', email: '', password: '', role: 'AGENT' })
      setShowForm(false)
      fetchData()
    } catch (err) { setError(err.response?.data?.message || 'Erro ao criar usuário') }
    finally { setSubmitting(false) }
  }

  const handleRoleChange = async (id, role) => {
    try { await axios.patch(`${API}/users/${id}`, { role }, { headers }); fetchData() }
    catch (err) { alert(err.response?.data?.message || 'Erro') }
  }

  const handleToggleActive = async (id, active) => {
    try { await axios.patch(`${API}/users/${id}`, { active: !active }, { headers }); fetchData() }
    catch (err) { alert(err.response?.data?.message || 'Sem permissão') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deletar este usuário?')) return
    try { await axios.delete(`${API}/users/${id}`, { headers }); fetchData() }
    catch (err) { alert(err.response?.data?.message || 'Sem permissão') }
  }

  const isSuperAdmin = myRole === 'SUPERADMIN'
  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 8 }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'monospace' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title="USUÁRIOS" subtitle="gestão de acessos" />
        <div style={{ padding: 24 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: `${users.length} total` },
                { label: `${users.filter(u => u.active).length} ativos` },
                { label: `${users.filter(u => u.role === 'AGENT').length} agentes` },
                { label: `${users.filter(u => u.role === 'ADMIN').length} admins` },
              ].map(s => (
                <span key={s.label} style={{ fontSize: 11, color: t.textMuted, letterSpacing: '0.08em' }}>{s.label}</span>
              ))}
            </div>
            {isSuperAdmin && (
              <button onClick={() => setShowForm(true)} style={{ padding: '8px 14px', background: '#b8ff57', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer' }}>
                + NOVO USUÁRIO
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 12, padding: '60px 0' }}>carregando...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 12, padding: '60px 0' }}>nenhum usuário encontrado</div>
          ) : (
            <div style={card}>
              <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, fontSize: 9, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', background: t.tableHead, borderRadius: '8px 8px 0 0' }}>
                <span style={{ flex: 1 }}>Nome</span>
                <span style={{ width: 190 }}>Email</span>
                <span style={{ width: 120 }}>Role</span>
                <span style={{ width: 80 }}>Status</span>
                <span style={{ width: 100 }}>Desde</span>
                <span style={{ width: 80 }}>Ações</span>
              </div>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', gap: 12, padding: '13px 16px', borderBottom: `1px solid ${t.borderLight}`, alignItems: 'center', opacity: u.active ? 1 : 0.5 }}>
                  <span style={{ flex: 1, color: t.textPrimary, fontSize: 13 }}>{u.name}</span>
                  <span style={{ width: 190, color: t.textSecondary, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                  <span style={{ width: 120 }}>
                    {u.role === 'SUPERADMIN' || !isSuperAdmin ? (
                      <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, ...ROLE_STYLE[u.role] }}>
                        {u.role}
                      </span>
                    ) : (
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10, color: t.textSecondary, fontFamily: 'monospace', cursor: 'pointer', outline: 'none' }}>
                        <option value="ADMIN">ADMIN</option>
                        <option value="AGENT">AGENT</option>
                        <option value="CLIENT">CLIENT</option>
                      </select>
                    )}
                  </span>
                  <span style={{ width: 80 }}>
                    {u.role !== 'SUPERADMIN' && isSuperAdmin ? (
                      <button onClick={() => handleToggleActive(u.id, u.active)}
                        style={{ padding: '3px 10px', background: 'transparent', borderRadius: 4, fontSize: 9, cursor: 'pointer', border: `1px solid ${u.active ? '#b8ff57' : t.border}`, color: u.active ? '#b8ff57' : t.textMuted, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                        {u.active ? 'ativo' : 'inativo'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: u.active ? '#b8ff57' : t.textMuted }}>{u.active ? 'ativo' : 'inativo'}</span>
                    )}
                  </span>
                  <span style={{ width: 100, color: t.textMuted, fontSize: 11 }}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                  <span style={{ width: 80 }}>
                    {u.role !== 'SUPERADMIN' && isSuperAdmin && (
                      <button onClick={() => handleDelete(u.id)}
                        style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #ff4d4d', borderRadius: 4, color: '#ff4d4d', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace' }}>
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

      {/* Modal criar */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '24px 28px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: t.textPrimary }}>[ NOVO USUÁRIO ]</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Nome completo', key: 'name', placeholder: 'Ex: João Silva', type: 'text' },
                { label: 'Email', key: 'email', placeholder: 'joao@empresa.com', type: 'email' },
                { label: 'Senha provisória', key: 'password', placeholder: 'mínimo 6 caracteres', type: 'password' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '9px 12px', fontSize: 12, color: t.textPrimary, fontFamily: 'monospace', outline: 'none' }}
                    value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Função</label>
                <select style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '9px 12px', fontSize: 12, color: t.textPrimary, fontFamily: 'monospace', outline: 'none' }}
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="AGENT">Agente</option>
                  <option value="ADMIN">Admin</option>
                  <option value="CLIENT">Cliente</option>
                </select>
              </div>
              <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>permissões · {form.role.toLowerCase()}</div>
                <div style={{ fontSize: 11, color: t.textSecondary, lineHeight: 1.8 }}>
                  {form.role === 'AGENT' && 'Vê todos os tickets, comenta em qualquer um, não pode mudar status ou prioridade.'}
                  {form.role === 'ADMIN' && 'Vê e edita todos os tickets, muda status e prioridade, não cria ou deleta usuários.'}
                  {form.role === 'CLIENT' && 'Abre tickets e comenta apenas nos seus próprios chamados.'}
                </div>
              </div>
              {error && <p style={{ fontSize: 12, color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '9px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.textSecondary, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '9px', background: '#b8ff57', border: 'none', borderRadius: 6, color: '#0d0d0d', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'monospace' }}>
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