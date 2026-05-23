import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        form
      )
      login(data.user, data.token)
      navigate('/')
    } catch {
      setError('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>[ HELPDESK ]</h1>
        <p style={styles.sub}>Entre na sua conta</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.forgotWrap}>
            <Link to="/forgot-password" style={styles.link}>Esqueceu a senha?</Link>
          </div>

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Entrando...' : 'ENTRAR →'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>ou</span>
          <span style={styles.dividerLine} />
        </div>

        <Link to="/register" style={styles.btnOutline}>
          CRIAR CONTA
        </Link>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d' },
  card: { background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '32px 28px', width: '100%', maxWidth: 380 },
  title: { fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#b8ff57', marginBottom: 4, textAlign: 'center' },
  sub: { fontSize: 12, color: '#444', textAlign: 'center', marginBottom: 24, letterSpacing: '0.1em' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 10, color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase' },
  input: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#d0d0d0', fontFamily: 'monospace', outline: 'none' },
  error: { fontSize: 12, color: '#ff4d4d', textAlign: 'center' },
  forgotWrap: { display: 'flex', justifyContent: 'flex-end' },
  link: { fontSize: 11, color: '#b8ff57', textDecoration: 'none', letterSpacing: '0.05em' },
  btn: { padding: '10px', background: '#b8ff57', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer', letterSpacing: '0.05em' },
  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: '#1f1f1f' },
  dividerText: { fontSize: 11, color: '#333' },
  btnOutline: { display: 'block', textAlign: 'center', padding: '10px', background: 'transparent', border: '1px solid #1f1f1f', borderRadius: 6, fontSize: 12, fontWeight: 800, color: '#888', letterSpacing: '0.05em' },
}