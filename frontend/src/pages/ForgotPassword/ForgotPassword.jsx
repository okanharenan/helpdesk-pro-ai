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
    e.preventDefault(); setError(''); setLoading(true)
    try { await forgotPassword(email); setSent(true) }
    catch { setError('Não foi possível enviar. Tente novamente.') }
    finally { setLoading(false) }
  }

  const inp = { background: '#1c1c1c', border: '1px solid #242424', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#f4f4f4', fontFamily: 'monospace', outline: 'none', width: '100%' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', fontFamily: 'monospace' }}>
      <div className="anim-scale" style={{ background: '#141414', border: '1px solid #242424', borderRadius: 10, padding: '32px 28px', width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#b8ff57', marginBottom: 4, textAlign: 'center' }}>[ HELPDESK ]</h1>

        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(184,255,87,0.1)', border: '1px solid #b8ff57', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#b8ff57' }}>✓</div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#f4f4f4' }}>Email enviado!</p>
            <p style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.7 }}>Verifique <span style={{ color: '#b8ff57' }}>{email}</span> e siga as instruções.</p>
            <Link to="/login" style={{ display: 'block', textAlign: 'center', padding: 10, background: '#b8ff57', borderRadius: 6, fontSize: 12, fontWeight: 800, color: '#0d0d0d', textDecoration: 'none', width: '100%' }}>
              VOLTAR AO LOGIN
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 1.7 }}>Digite seu email para receber o link de redefinição.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Email</label>
                <input type="email" style={inp} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              {error && <p style={{ fontSize: 12, color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ padding: 10, background: '#b8ff57', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, color: '#0d0d0d', cursor: 'pointer' }}>
                {loading ? 'Enviando...' : 'ENVIAR LINK →'}
              </button>
            </form>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 20 }}>
              Lembrou? <Link to="/login" style={{ color: '#b8ff57', textDecoration: 'none' }}>Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}