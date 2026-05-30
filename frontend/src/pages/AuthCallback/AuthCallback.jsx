import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function AuthCallback() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Autenticando...')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) { setStatus('Erro ao autenticar. Redirecionando...'); setTimeout(() => navigate('/login'), 2000); return }
      if (session) { login(session.user, session.access_token); navigate('/') }
      else { setStatus('Sessão não encontrada.'); setTimeout(() => navigate('/login'), 2000) }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', fontFamily: 'monospace' }}>
      <div className="anim-scale" style={{ background: '#141414', border: '1px solid #242424', borderRadius: 10, padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minWidth: 280 }}>
        <div className="anim-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #242424', borderTopColor: '#b8ff57' }} />
        <p style={{ fontSize: 13, color: '#b8ff57', letterSpacing: '0.05em' }}>{status}</p>
        <p style={{ fontSize: 10, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase' }}>aguarde um momento</p>
      </div>
    </div>
  )
}