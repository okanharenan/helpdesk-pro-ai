import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      setError('Não foi possível enviar o email. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>

        <div style={styles.header}>
          <h1 style={styles.title}>[ HELPDESK ]</h1>
          <p style={styles.sub}>Recuperar senha</p>
        </div>

        {sent ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.successTitle}>Email enviado!</p>
            <p style={styles.successText}>
              Verifique sua caixa de entrada em{' '}
              <span style={{ color: '#b8ff57' }}>{email}</span>{' '}
              e siga as instruções para redefinir sua senha.
            </p>
            <Link to="/login" style={styles.btn}>
              VOLTAR AO LOGIN
            </Link>
          </div>
        ) : (
          <>
            <p style={styles.desc}>
              Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  style={styles.input}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <button type="submit" style={styles.btn} disabled={loading}>
                {loading ? 'Enviando...' : 'ENVIAR LINK →'}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>ou entre com</span>
              <span style={styles.dividerLine} />
            </div>

            <div style={styles.socialRow}>
              <a href={`${import.meta.env.VITE_API_URL}/auth/google`} style={styles.socialBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </a>
              <a href={`${import.meta.env.VITE_API_URL}/auth/facebook`} style={styles.socialBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
            </div>

            <p style={styles.footer}>
              Lembrou a senha?{' '}
              <Link to="/login" style={styles.link}>Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', fontFamily: 'monospace' },
  card: { background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '32px 28px', width: '100%', maxWidth: 380 },
  header: { textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 800, color: '#b8ff57', marginBottom: 4 },
  sub: { fontSize: 12, color: '#444', letterSpacing: '0.1em' },
  desc: { fontSize: 12, color: '#333', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 10, color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase' },
  input: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#d0d0d0', fontFamily: 'monospace', outline: 'none' },
  error: { fontSize: 12, color: '#ff4d4d', textAlign: 'center' },
  btn: { display: 'block', textAlign: 'center', padding: '10px', background: '#b8ff57', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer', letterSpacing: '0.05em', textDecoration: 'none' },
  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: '#1f1f1f' },
  dividerText: { fontSize: 10, color: '#333', letterSpacing: '0.1em', whiteSpace: 'nowrap' },
  socialRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 },
  socialBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 6, fontSize: 12, color: '#888', textDecoration: 'none' },
  footer: { textAlign: 'center', fontSize: 12, color: '#444' },
  link: { color: '#b8ff57', textDecoration: 'none' },
  successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' },
  successIcon: { width: 48, height: 48, borderRadius: '50%', background: 'rgba(184,255,87,0.1)', border: '1px solid #b8ff57', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#b8ff57' },
  successTitle: { fontSize: 15, fontWeight: 800, color: '#f0f0f0' },
  successText: { fontSize: 12, color: '#444', lineHeight: 1.7 },
}