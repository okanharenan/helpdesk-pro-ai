import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useMe } from '../../contexts/MeContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const links = [
  { path: '/',       label: 'Overview',  icon: '▣' },
  { path: '/tickets', label: 'Tickets',   icon: '◈' },
  { path: '/users',   label: 'Usuários',  icon: '◉' },
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

  const bg     = dark ? '#0a0a0a' : '#ffffff'
  const border = dark ? '#242424' : '#e0e0e0'
  const text   = dark ? '#f4f4f4' : '#111111'
  const sec    = dark ? '#c0c0c0' : '#333333'
  const muted  = dark ? '#888888' : '#666666'
  const inputBg= dark ? '#1c1c1c' : '#f7f7f7'
  const toggleBg = dark ? '#141414' : '#f5f5f5'
  const cardBg = dark ? '#141414' : '#ffffff'

  const handleLogout = () => { clearMe(); logout(); navigate('/login') }

  return (
    <div className="anim-left" style={{ width: 220, minHeight: '100vh', background: bg, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', fontFamily: 'monospace', flexShrink: 0 }}>

      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#b8ff57', lineHeight: 1 }}>[</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: text, letterSpacing: '-0.5px', padding: '0 2px' }}>HELPDESK</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#b8ff57', lineHeight: 1 }}>]</span>
        </div>
        <div style={{ fontSize: 9, color: muted, letterSpacing: '0.15em' }}>pro ai · v1.0</div>
      </div>

      <div style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: 9, color: muted, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>menu</div>
        {links.map(({ path, label, icon }) => (
          <button key={path} onClick={() => navigate(path)}
            className="transition-colors"
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginBottom: 2, textAlign: 'left', letterSpacing: '0.03em', color: pathname === path ? '#0d0d0d' : sec, background: pathname === path ? '#b8ff57' : 'transparent', border: `1px solid ${pathname === path ? '#b8ff57' : 'transparent'}` }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 14, borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={toggle} className="transition-colors"
          style={{ width: '100%', padding: 7, background: toggleBg, border: `1px solid ${border}`, borderRadius: 6, fontSize: 10, cursor: 'pointer', letterSpacing: '0.08em', textAlign: 'left', color: sec }}>
          {dark ? '☀ modo claro' : '◑ modo escuro'}
        </button>

        {dbRole === 'SUPERADMIN' && (
          <button onClick={() => setShowSettings(true)} className="transition-colors"
            style={{ width: '100%', padding: 7, background: 'transparent', border: `1px solid ${border}`, borderRadius: 6, fontSize: 10, cursor: 'pointer', letterSpacing: '0.08em', textAlign: 'left', color: '#b8ff57' }}>
            ⚙ configurações
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 5, background: '#b8ff57', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0d0d0d', flexShrink: 0 }}>
            {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: sec }}>{me?.name || user?.user_metadata?.name || 'Usuário'}</div>
            <div style={{ fontSize: 9, color: muted, letterSpacing: '0.05em', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dbRole || '...'}</div>
          </div>
        </div>

        <button onClick={handleLogout} className="transition-colors"
          style={{ width: '100%', padding: 7, background: 'transparent', border: `1px solid ${border}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em', textAlign: 'left', color: sec }}>
          ⎋ sair
        </button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} token={token} dark={dark} bg={cardBg} border={border} text={text} sec={sec} muted={muted} inputBg={inputBg} />}
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
    AGENT:  'Vê todos os tickets, comenta, não edita status',
    ADMIN:  'Vê e edita todos os tickets, não cria usuários',
    CLIENT: 'Abre e comenta nos próprios tickets',
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setSubmitting(true)
    try {
      await axios.post(`${API}/users`, form, { headers: { Authorization: `Bearer ${token}` } })
      setSuccess(`Usuário ${form.name} criado!`)
      setForm({ name: '', email: '', password: '', role: 'AGENT' })
    } catch (err) { setError(err.response?.data?.message || 'Erro ao criar') }
    finally { setSubmitting(false) }
  }

  const inp = { background: inputBg, border: `1px solid ${border}`, borderRadius: 6, padding: '9px 12px', fontSize: 12, color: text, fontFamily: 'monospace', outline: 'none', width: '100%' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="anim-scale" style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '24px 28px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: text }}>[ CONFIGURAÇÕES ]</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ fontSize: 9, color: muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>criar novo usuário</div>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 9, color: muted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Nome</label>
              <input style={inp} placeholder="Nome completo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 9, color: muted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Email</label>
              <input type="email" style={inp} placeholder="email@empresa.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 9, color: muted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Senha provisória</label>
              <input type="password" style={inp} placeholder="mínimo 6 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 9, color: muted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Função</label>
              <select style={inp} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="AGENT">Agente</option>
                <option value="ADMIN">Admin</option>
                <option value="CLIENT">Cliente</option>
              </select>
            </div>
          </div>
          <div style={{ background: inputBg, border: `1px solid ${border}`, borderRadius: 6, padding: '10px 14px' }}>
            <div style={{ fontSize: 9, color: muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>permissões · {form.role.toLowerCase()}</div>
            <div style={{ fontSize: 11, color: sec, lineHeight: 1.7 }}>{ROLES[form.role]}</div>
          </div>
          {error   && <p style={{ fontSize: 12, color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}
          {success && <p style={{ fontSize: 12, color: '#b8ff57', textAlign: 'center' }}>{success}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => { onClose(); navigate('/users') }}
              style={{ flex: 1, padding: 9, background: inputBg, border: `1px solid ${border}`, borderRadius: 6, color: sec, fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}>
              gerenciar usuários →
            </button>
            <button type="submit" disabled={submitting}
              style={{ flex: 1, padding: 9, background: '#b8ff57', border: 'none', borderRadius: 6, color: '#0d0d0d', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'monospace' }}>
              {submitting ? 'criando...' : 'CRIAR USUÁRIO →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}