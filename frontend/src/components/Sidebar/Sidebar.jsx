import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useMe } from '../../contexts/MeContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const links = [
  { path: '/',        label: 'Dashboard',    icon: 'ti-layout-dashboard' },
  { path: '/tickets', label: 'Tickets',      icon: 'ti-ticket' },
  { path: '/users',   label: 'Usuários',     icon: 'ti-users' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const { me, clearMe } = useMe()
  const [showSettings, setShowSettings] = useState(false)

  const token  = localStorage.getItem('helpdesk_token')
  const dbRole = me?.role

  const bg      = dark ? '#0f0f0f' : '#ffffff'
  const border  = dark ? '#1f1f1f' : '#e5e7eb'
  const text    = dark ? '#f4f4f4' : '#111111'
  const sec     = dark ? '#c0c0c0' : '#374151'
  const muted   = dark ? '#666666' : '#9ca3af'
  const inputBg = dark ? '#1c1c1c' : '#f9fafb'
  const cardBg  = dark ? '#141414' : '#ffffff'
  const activeBg    = dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4'
  const activeColor = dark ? '#4ade80' : '#166534'
  const activeBorder = dark ? 'rgba(22,163,74,0.3)' : '#bbf7d0'

  const handleLogout = () => { clearMe(); logout(); navigate('/login') }

  const initials = (me?.name || user?.user_metadata?.name || user?.email || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ width: 220, minHeight: '100vh', background: bg, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', flexShrink: 0 }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-headset" style={{ fontSize: 15, color: '#fff' }} aria-hidden="true" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: text, letterSpacing: '-0.3px' }}>HelpDesk Pro</span>
        </div>
        <div style={{ fontSize: 10, color: muted, marginLeft: 36 }}>Serviços Gerais · v2.0</div>
      </div>

      {/* Nav */}
      <div style={{ padding: '14px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, color: muted, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 }}>workspace</div>
        {links.map(({ path, label, icon }) => {
          const active = pathname === path
          return (
            <button key={path} onClick={() => navigate(path)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 10px', borderRadius: 7, fontSize: 13, cursor: 'pointer', marginBottom: 2, textAlign: 'left', color: active ? activeColor : sec, background: active ? activeBg : 'transparent', border: `1px solid ${active ? activeBorder : 'transparent'}`, fontWeight: active ? 600 : 400, transition: 'all 0.15s' }}>
              <i className={`ti ${icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
              {label}
            </button>
          )
        })}

        {/* Relatórios — em breve */}
        <button style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 10px', borderRadius: 7, fontSize: 13, cursor: 'not-allowed', marginBottom: 2, textAlign: 'left', color: muted, background: 'transparent', border: '1px solid transparent', opacity: 0.5 }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 16 }} aria-hidden="true" />
          Relatórios
          <span style={{ marginLeft: 'auto', fontSize: 9, background: dark ? '#1f1f1f' : '#f3f4f6', color: muted, padding: '2px 6px', borderRadius: 4 }}>em breve</span>
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>

        <button onClick={toggle}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: inputBg, border: `1px solid ${border}`, borderRadius: 7, fontSize: 12, cursor: 'pointer', color: sec, transition: 'all 0.15s' }}>
          <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: 14 }} aria-hidden="true" />
          {dark ? 'Modo claro' : 'Modo escuro'}
        </button>

        {dbRole === 'SUPERADMIN' && (
          <button onClick={() => setShowSettings(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: dark ? 'rgba(22,163,74,0.08)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}`, borderRadius: 7, fontSize: 12, cursor: 'pointer', color: '#16a34a', transition: 'all 0.15s' }}>
            <i className="ti ti-settings" style={{ fontSize: 14 }} aria-hidden="true" />
            Configurações
          </button>
        )}

        {/* Usuário */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: inputBg, borderRadius: 7, marginTop: 2 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {me?.name || user?.user_metadata?.name || 'Usuário'}
            </div>
            <div style={{ fontSize: 10, color: muted, marginTop: 1 }}>{dbRole || '...'}</div>
          </div>
        </div>

        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'transparent', border: `1px solid ${border}`, borderRadius: 7, fontSize: 12, cursor: 'pointer', color: sec, transition: 'all 0.15s' }}>
          <i className="ti ti-logout" style={{ fontSize: 14 }} aria-hidden="true" />
          Sair
        </button>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          token={token} dark={dark} bg={cardBg}
          border={border} text={text} sec={sec} muted={muted} inputBg={inputBg}
        />
      )}
    </div>
  )
}

function SettingsModal({ onClose, token, dark, bg, border, text, sec, muted, inputBg }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const ROLES = {
    AGENT:  'Vê todos os tickets, comenta em qualquer um, não pode mudar status ou prioridade.',
    ADMIN:  'Vê e edita todos os tickets, muda status e prioridade. Não cria ou deleta usuários.',
    CLIENT: 'Abre tickets e comenta apenas nos seus próprios chamados.',
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setSubmitting(true)
    try {
      await axios.post(`${API}/users`, form, { headers: { Authorization: `Bearer ${token}` } })
      setSuccess(`Usuário ${form.name} criado com sucesso!`)
      setForm({ name: '', email: '', password: '', role: 'AGENT' })
    } catch (err) { setError(err.response?.data?.message || 'Erro ao criar usuário') }
    finally { setSubmitting(false) }
  }

  const inp = { background: inputBg, border: `1px solid ${border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: text, fontFamily: 'system-ui, sans-serif', outline: 'none', width: '100%' }
  const lbl = { fontSize: 11, color: muted, fontWeight: 500, marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="anim-scale" style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '24px 28px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: text }}>Configurações</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>Criar novo usuário no sistema</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Nome completo</label>
              <input style={inp} placeholder="Ex: João Silva" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label style={lbl}>Email corporativo</label>
              <input type="email" style={inp} placeholder="joao@empresa.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Senha provisória</label>
              <input type="password" style={inp} placeholder="mínimo 6 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label style={lbl}>Função</label>
              <select style={inp} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="AGENT">Agente</option>
                <option value="ADMIN">Admin</option>
                <option value="CLIENT">Cliente</option>
              </select>
            </div>
          </div>

          <div style={{ background: dark ? 'rgba(22,163,74,0.08)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>
              Permissões · {form.role === 'AGENT' ? 'Agente' : form.role === 'ADMIN' ? 'Admin' : 'Cliente'}
            </div>
            <div style={{ fontSize: 12, color: sec, lineHeight: 1.6 }}>{ROLES[form.role]}</div>
          </div>

          {error   && <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', margin: 0 }}>{error}</p>}
          {success && <p style={{ fontSize: 12, color: '#16a34a', textAlign: 'center', margin: 0 }}>{success}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => { onClose(); navigate('/users') }}
              style={{ flex: 1, padding: '10px', background: inputBg, border: `1px solid ${border}`, borderRadius: 7, color: sec, fontSize: 13, cursor: 'pointer' }}>
              Gerenciar usuários →
            </button>
            <button type="submit" disabled={submitting}
              style={{ flex: 1, padding: '10px', background: '#16a34a', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {submitting ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}