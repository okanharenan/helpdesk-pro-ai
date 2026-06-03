import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import { useThemeColors } from '../../hooks/useThemeColors'
import { useTheme } from '../../contexts/ThemeContext'
import { useMe } from '../../contexts/MeContext'

const API = import.meta.env.VITE_API_URL

const ROLE_STYLE = {
  SUPERADMIN: { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a', label: 'Superadmin' },
  ADMIN:      { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb', label: 'Admin'      },
  AGENT:      { bg: 'rgba(217,119,6,0.08)',  color: '#d97706', label: 'Agente'     },
  CLIENT:     { bg: 'rgba(107,114,128,0.08)',color: '#6b7280', label: 'Cliente'    },
}

export default function Users() {
  const t = useThemeColors()
  const { dark } = useTheme()
  const { me } = useMe()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('helpdesk_token')
  const headers = { Authorization: `Bearer ${token}` }
  const myRole = me?.role
  const isSuperAdmin = myRole === 'SUPERADMIN'

  const fetchUsers = async () => {
    try { const { data } = await axios.get(`${API}/users`, { headers }); setUsers(data) }
    catch { console.error('Erro ao buscar usuários') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      await axios.post(`${API}/users`, form, { headers })
      setForm({ name: '', email: '', password: '', role: 'AGENT' })
      setShowForm(false); fetchUsers()
    } catch (err) { setError(err.response?.data?.message || 'Erro ao criar usuário') }
    finally { setSubmitting(false) }
  }

  const handleRoleChange = async (id, role) => {
    try { await axios.patch(`${API}/users/${id}`, { role }, { headers }); fetchUsers() }
    catch (err) { alert(err.response?.data?.message || 'Erro ao atualizar') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deletar este usuário permanentemente?')) return
    try { await axios.delete(`${API}/users/${id}`, { headers }); fetchUsers() }
    catch (err) { alert(err.response?.data?.message || 'Sem permissão') }
  }

  const filtered = users
    .filter(u => filterRole === 'ALL' || u.role === filterRole)
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  const counts = {
    ALL: users.length,
    SUPERADMIN: users.filter(u => u.role === 'SUPERADMIN').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    AGENT: users.filter(u => u.role === 'AGENT').length,
    CLIENT: users.filter(u => u.role === 'CLIENT').length,
  }

  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 10 }
  const inp  = { background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: t.textPrimary, fontFamily: 'system-ui, sans-serif', outline: 'none', width: '100%' }
  const lbl  = { fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 5, display: 'block' }

  const ROLES_DESC = {
    AGENT:  'Vê todos os tickets, comenta em qualquer um. Não pode mudar status ou prioridade.',
    ADMIN:  'Vê e edita todos os tickets, muda status e prioridade. Não cria ou deleta usuários.',
    CLIENT: 'Abre tickets e comenta apenas nos seus próprios chamados.',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title="Usuários" subtitle="gestão de acessos e permissões" />

        <div className="anim-fade" style={{ padding: 22 }}>

          {/* Cards de contagem */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { key: 'ALL',        label: 'Total',      icon: 'ti-users'       },
              { key: 'SUPERADMIN', label: 'Superadmin', icon: 'ti-shield'      },
              { key: 'ADMIN',      label: 'Admins',     icon: 'ti-user-check'  },
              { key: 'AGENT',      label: 'Agentes',    icon: 'ti-headset'     },
              { key: 'CLIENT',     label: 'Clientes',   icon: 'ti-user'        },
            ].map(f => (
              <button key={f.key} onClick={() => setFilterRole(f.key)}
                style={{ padding: '12px 14px', borderRadius: 9, border: `1.5px solid ${filterRole === f.key ? '#16a34a' : t.border}`, background: filterRole === f.key ? (dark ? 'rgba(22,163,74,0.12)' : '#f0fdf4') : t.cardBg, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize: 14, color: filterRole === f.key ? '#16a34a' : t.textMuted }} aria-hidden="true" />
                  <span style={{ fontSize: 11, color: filterRole === f.key ? '#16a34a' : t.textMuted }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: filterRole === f.key ? '#16a34a' : t.textPrimary }}>
                  {loading ? '—' : counts[f.key]}
                </div>
              </button>
            ))}
          </div>

          {/* Barra de ações */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', width: 260 }}>
              <i className="ti ti-search" style={{ fontSize: 15, color: t.textMuted }} aria-hidden="true" />
              <input placeholder="Buscar usuário..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: t.textPrimary, flex: 1, fontFamily: 'system-ui, sans-serif' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>}
            </div>
            {isSuperAdmin && (
              <button onClick={() => setShowForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#16a34a', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                <i className="ti ti-user-plus" style={{ fontSize: 15 }} aria-hidden="true" />
                Novo Usuário
              </button>
            )}
          </div>

          {/* Tabela */}
          {loading ? (
            <div style={card}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 200px 120px 110px 90px', gap: 12, padding: '16px', borderBottom: `1px solid ${t.borderLight}`, alignItems: 'center' }}>
                  {[44,140,150,70,60,50].map((w,j) => (
                    <div key={j} className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: w === 44 ? 44 : 13, width: w === 44 ? 44 : w, borderRadius: w === 44 ? 8 : 4 }} />
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...card, padding: '60px 0', textAlign: 'center' }}>
              <i className="ti ti-users-off" style={{ fontSize: 36, color: t.textMuted, display: 'block', marginBottom: 12 }} aria-hidden="true" />
              <div style={{ fontSize: 14, color: t.textMuted }}>Nenhum usuário encontrado</div>
            </div>
          ) : (
            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 200px 120px 110px 90px', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, fontSize: 11, color: t.textMuted, fontWeight: 500, background: dark ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderRadius: '10px 10px 0 0' }}>
                <span></span><span>Usuário</span><span>Email</span><span>Função</span><span>Membro desde</span><span>Ações</span>
              </div>
              {filtered.map((u, i) => {
                const rs = ROLE_STYLE[u.role] || ROLE_STYLE.CLIENT
                const initials = u.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
                return (
                  <div key={u.id} className={`anim-fade anim-d${Math.min(i+1,5)}`}
                    style={{ display: 'grid', gridTemplateColumns: '44px 1fr 200px 120px 110px 90px', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${t.borderLight}`, alignItems: 'center', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    <div style={{ width: 36, height: 36, borderRadius: 9, background: rs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: rs.color }}>
                      {initials}
                    </div>

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>{u.name}</div>
                      {u.role === 'SUPERADMIN' && (
                        <div style={{ fontSize: 10, color: '#16a34a', marginTop: 2 }}>Acesso total ao sistema</div>
                      )}
                    </div>

                    <span style={{ fontSize: 12, color: t.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>

                    <span>
                      {u.role === 'SUPERADMIN' || !isSuperAdmin ? (
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, fontWeight: 500, background: rs.bg, color: rs.color }}>
                          {rs.label}
                        </span>
                      ) : (
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 7, padding: '5px 10px', fontSize: 12, color: t.textPrimary, fontFamily: 'system-ui, sans-serif', cursor: 'pointer', outline: 'none' }}>
                          <option value="ADMIN">Admin</option>
                          <option value="AGENT">Agente</option>
                          <option value="CLIENT">Cliente</option>
                        </select>
                      )}
                    </span>

                    <span style={{ fontSize: 12, color: t.textMuted }}>
                      {new Date(u.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>

                    <span>
                      {u.role !== 'SUPERADMIN' && isSuperAdmin && (
                        <button onClick={() => handleDelete(u.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>
                          <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                          Deletar
                        </button>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal criar usuário */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="anim-scale" style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '26px 28px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary }}>Adicionar usuário</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Crie um novo acesso ao sistema</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Nome completo</label>
                  <input style={inp} placeholder="Ex: João Silva" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" style={inp} placeholder="joao@empresa.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
              </div>

              <div>
                <label style={lbl}>Senha provisória</label>
                <input type="password" style={inp} placeholder="mínimo 6 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              </div>

              <div>
                <label style={lbl}>Função no sistema</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { value: 'AGENT',  label: 'Agente',  icon: 'ti-headset',    color: '#d97706' },
                    { value: 'ADMIN',  label: 'Admin',   icon: 'ti-user-check', color: '#2563eb' },
                    { value: 'CLIENT', label: 'Cliente', icon: 'ti-user',       color: '#6b7280' },
                  ].map(r => (
                    <button key={r.value} type="button" onClick={() => setForm({...form, role: r.value})}
                      style={{ padding: '10px 8px', borderRadius: 8, border: `1.5px solid ${form.role === r.value ? r.color : t.border}`, background: form.role === r.value ? `${r.color}15` : t.inputBg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.12s' }}>
                      <i className={`ti ${r.icon}`} style={{ fontSize: 18, color: form.role === r.value ? r.color : t.textMuted, display: 'block', marginBottom: 4 }} aria-hidden="true" />
                      <div style={{ fontSize: 12, fontWeight: 600, color: form.role === r.value ? r.color : t.textPrimary }}>{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: dark ? 'rgba(22,163,74,0.06)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(22,163,74,0.15)' : '#bbf7d0'}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>
                  Permissões — {form.role === 'AGENT' ? 'Agente' : form.role === 'ADMIN' ? 'Admin' : 'Cliente'}
                </div>
                <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.6 }}>{ROLES_DESC[form.role]}</div>
              </div>

              {error && <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textSecondary, fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '10px', background: '#16a34a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {submitting ? 'Criando...' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}