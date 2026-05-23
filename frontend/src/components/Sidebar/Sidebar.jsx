import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const links = [
  { path: '/', label: 'Overview', icon: '▣' },
  { path: '/tickets', label: 'Tickets', icon: '◈' },
  { path: '/users', label: 'Usuários', icon: '◉' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const [dbRole, setDbRole] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const token = localStorage.getItem('helpdesk_token')

  useEffect(() => {
    if (!token) return
    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDbRole(res.data.role))
      .catch(() => {})
  }, [token])

  const handleLogout = () => { logout(); navigate('/login') }

  const t = dark ? DARK : LIGHT

  return (
    <div style={{ ...styles.sidebar, background: t.sideBg, borderRight: `1px solid ${t.border}` }}>

      {/* Logo */}
      <div style={{ ...styles.logoWrap, borderBottom: `1px solid ${t.border}` }}>
        <div style={styles.logo}>
          <span style={{ ...styles.logoBracket, color: '#b8ff57' }}>[</span>
          <span style={{ ...styles.logoText, color: t.textPrimary }}>HELPDESK</span>
          <span style={{ ...styles.logoBracket, color: '#b8ff57' }}>]</span>
        </div>
        <div style={{ ...styles.logoSub, color: t.textMuted }}>pro ai · v1.0</div>
      </div>

      {/* Nav */}
      <div style={styles.navSection}>
        <div style={{ ...styles.navLabel, color: t.textMuted }}>menu</div>
        {links.map(({ path, label, icon }) => (
          <button key={path} onClick={() => navigate(path)}
            style={{
              ...styles.navItem,
              color: pathname === path ? '#0d0d0d' : t.textSecondary,
              background: pathname === path ? '#b8ff57' : 'transparent',
              border: `1px solid ${pathname === path ? '#b8ff57' : 'transparent'}`,
            }}>
            <span style={styles.navIcon}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ ...styles.sidebarFooter, borderTop: `1px solid ${t.border}` }}>

        {/* Toggle tema */}
        <button onClick={toggle} style={{ ...styles.themeToggle, background: t.toggleBg, border: `1px solid ${t.border}`, color: t.textSecondary }}>
          {dark ? '☀ modo claro' : '◑ modo escuro'}
        </button>

        {/* Engrenagem — só SUPERADMIN */}
        {dbRole === 'SUPERADMIN' && (
          <button onClick={() => setShowSettings(true)}
            style={{ ...styles.settingsBtn, border: `1px solid ${t.border}`, color: '#b8ff57' }}>
            ⚙ configurações
          </button>
        )}

        {/* Usuário */}
        <div style={styles.userRow}>
          <div style={styles.avatar}>
            {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...styles.userName, color: t.textSecondary }}>
              {user?.user_metadata?.name || 'Usuário'}
            </div>
            <div style={{ ...styles.userRole, color: t.textMuted }}>
              {dbRole || '...'}
            </div>
          </div>
        </div>

        <button onClick={handleLogout}
          style={{ ...styles.logoutBtn, border: `1px solid ${t.border}`, color: t.textSecondary }}>
          ⎋ sair
        </button>
      </div>

      {/* Modal configurações */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} t={t} token={token} />
      )}
    </div>
  )
}

function SettingsModal({ onClose, t, token }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const API = import.meta.env.VITE_API_URL

  const ROLES = {
    AGENT: { desc: 'Vê todos os tickets, comenta, não edita status' },
    ADMIN: { desc: 'Vê e edita todos os tickets, não cria usuários' },
    CLIENT: { desc: 'Abre e comenta nos próprios tickets' },
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setSubmitting(true)
    try {
      await axios.post(`${API}/users`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess(`Usuário ${form.name} criado com sucesso!`)
      setForm({ name: '', email: '', password: '', role: 'AGENT' })
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar usuário')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, background: t.cardBg, border: `1px solid ${t.border}` }}>
        <div style={styles.modalHead}>
          <span style={{ ...styles.modalTitle, color: t.textPrimary }}>[ CONFIGURAÇÕES ]</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ ...styles.settingsTabs }}>
          <div style={{ ...styles.settingsSection, borderBottom: `1px solid ${t.border}`, paddingBottom: 20, marginBottom: 20 }}>
            <div style={{ ...styles.sectionTitle, color: t.textMuted }}>criar novo usuário</div>
            <form onSubmit={handleCreate} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.field}>
                  <label style={{ ...styles.label, color: t.textMuted }}>Nome</label>
                  <input style={{ ...styles.input, background: t.inputBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                    placeholder="Nome completo"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div style={styles.field}>
                  <label style={{ ...styles.label, color: t.textMuted }}>Email</label>
                  <input type="email" style={{ ...styles.input, background: t.inputBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                    placeholder="email@empresa.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.field}>
                  <label style={{ ...styles.label, color: t.textMuted }}>Senha provisória</label>
                  <input type="password" style={{ ...styles.input, background: t.inputBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                    placeholder="mínimo 6 caracteres"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div style={styles.field}>
                  <label style={{ ...styles.label, color: t.textMuted }}>Função</label>
                  <select style={{ ...styles.input, background: t.inputBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="AGENT">Agente</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CLIENT">Cliente</option>
                  </select>
                </div>
              </div>

              {/* Card de permissões */}
              <div style={{ ...styles.permBox, background: t.inputBg, border: `1px solid ${t.border}` }}>
                <div style={{ ...styles.permTitle, color: t.textMuted }}>permissões · {form.role.toLowerCase()}</div>
                <div style={{ fontSize: 11, color: t.textSecondary, lineHeight: 1.8 }}>
                  {ROLES[form.role].desc}
                </div>
              </div>

              {error && <p style={styles.error}>{error}</p>}
              {success && <p style={styles.success}>{success}</p>}

              <div style={styles.modalBtns}>
                <button type="button" onClick={() => navigate('/users')}
                  style={{ ...styles.cancelBtn, background: t.inputBg, border: `1px solid ${t.border}`, color: t.textSecondary }}>
                  gerenciar usuários →
                </button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'criando...' : 'CRIAR USUÁRIO →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const DARK = {
  sideBg: '#0a0a0a',
  cardBg: '#111',
  inputBg: '#1a1a1a',
  border: '#1f1f1f',
  textPrimary: '#f0f0f0',
  textSecondary: '#aaaaaa',
  textMuted: '#555555',
  toggleBg: '#111',
}
const LIGHT = {
  sideBg: '#ffffff',
  cardBg: '#ffffff',
  inputBg: '#f5f5f5',
  border: '#e0e0e0',
  textPrimary: '#111111',
  textSecondary: '#444444',
  textMuted: '#888888',
  toggleBg: '#f5f5f5',
}

const styles = {
  sidebar: { width: 220, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'monospace', flexShrink: 0 },
  logoWrap: { padding: '20px 20px 16px' },
  logo: { display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 },
  logoBracket: { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  logoText: { fontSize: 15, fontWeight: 800, letterSpacing: '-0.5px', padding: '0 2px' },
  logoSub: { fontSize: 9, letterSpacing: '0.15em' },
  navSection: { padding: '16px 12px', flex: 1 },
  navLabel: { fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginBottom: 2, textAlign: 'left', letterSpacing: '0.03em', transition: 'all 0.12s', fontFamily: 'monospace' },
  navIcon: { fontSize: 14 },
  sidebarFooter: { padding: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  themeToggle: { width: '100%', padding: '7px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.08em', textAlign: 'left' },
  settingsBtn: { width: '100%', padding: '7px', background: 'transparent', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.08em', textAlign: 'left' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 30, height: 30, borderRadius: 5, background: '#b8ff57', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0d0d0d', flexShrink: 0 },
  userName: { fontSize: 11, fontWeight: 500 },
  userRole: { fontSize: 9, letterSpacing: '0.05em', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: { width: '100%', padding: '7px', background: 'transparent', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.05em', textAlign: 'left' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { borderRadius: 10, padding: '24px 28px', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' },
  modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 14, fontWeight: 800 },
  settingsTabs: {},
  settingsSection: {},
  sectionTitle: { fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' },
  input: { borderRadius: 6, padding: '9px 12px', fontSize: 12, fontFamily: 'monospace', outline: 'none' },
  permBox: { borderRadius: 6, padding: '10px 14px' },
  permTitle: { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 },
  error: { fontSize: 12, color: '#ff4d4d', textAlign: 'center' },
  success: { fontSize: 12, color: '#b8ff57', textAlign: 'center' },
  modalBtns: { display: 'flex', gap: 8 },
  cancelBtn: { flex: 1, padding: '9px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'monospace', textAlign: 'center' },
  submitBtn: { flex: 1, padding: '9px', background: '#b8ff57', border: 'none', borderRadius: 6, color: '#0d0d0d', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'monospace' },
}