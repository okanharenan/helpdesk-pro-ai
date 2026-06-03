import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useState } from 'react'

export default function Navbar({ title = 'Dashboard', subtitle = 'visão geral' }) {
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)

  const bg     = dark ? '#0f0f0f' : '#ffffff'
  const border = dark ? '#1f1f1f' : '#e5e7eb'
  const text   = dark ? '#f4f4f4' : '#111111'
  const muted  = dark ? '#666666' : '#9ca3af'
  const sec    = dark ? '#c0c0c0' : '#374151'
  const inputBg = dark ? '#1a1a1a' : '#f9fafb'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 22px', background: bg, borderBottom: `1px solid ${border}`, fontFamily: 'system-ui, sans-serif', flexShrink: 0 }}>

      {/* Título */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: text }}>{title}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{subtitle}</div>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Busca rápida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: inputBg, border: `1px solid ${border}`, borderRadius: 8, padding: '7px 12px' }}>
          <i className="ti ti-search" style={{ fontSize: 14, color: muted }} aria-hidden="true" />
          <input
            placeholder="Buscar ticket..."
            onKeyDown={e => { if (e.key === 'Enter' && e.target.value) navigate('/tickets') }}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: text, width: 140, fontFamily: 'system-ui, sans-serif' }}
          />
        </div>

        {/* Notificações */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotif(v => !v)}
            style={{ width: 34, height: 34, borderRadius: 8, background: inputBg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: sec }}>
            <i className="ti ti-bell" style={{ fontSize: 16 }} aria-hidden="true" />
            <div style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, background: '#dc2626', borderRadius: '50%', border: `2px solid ${bg}` }} />
          </button>

          {showNotif && (
            <div className="anim-slide" style={{ position: 'absolute', right: 0, top: 42, width: 280, background: dark ? '#141414' : '#fff', border: `1px solid ${border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${border}`, fontSize: 13, fontWeight: 600, color: text }}>Notificações</div>
              {[
                { icon: 'ti-alert-triangle', color: '#dc2626', msg: 'Ticket #119 urgente sem resposta há 4h', time: '4h' },
                { icon: 'ti-ticket',         color: '#2563eb', msg: 'Novo ticket #124 aberto — Sala 204',    time: '1h' },
                { icon: 'ti-circle-check',   color: '#16a34a', msg: 'Ticket #118 resolvido por Carlos',      time: '2h' },
              ].map((n, i) => (
                <div key={i} onClick={() => { navigate('/tickets'); setShowNotif(false) }}
                  style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${border}`, cursor: 'pointer', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? '#1a1a1a' : '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <i className={`ti ${n.icon}`} style={{ fontSize: 16, color: n.color, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: sec, lineHeight: 1.4 }}>{n.msg}</div>
                    <div style={{ fontSize: 10, color: muted, marginTop: 3 }}>há {n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 14px', textAlign: 'center' }}>
                <button onClick={() => setShowNotif(false)} style={{ fontSize: 12, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Ver todas as notificações →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Novo ticket */}
        <button onClick={() => navigate('/tickets')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#16a34a', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <i className="ti ti-plus" style={{ fontSize: 15 }} aria-hidden="true" />
          Novo Ticket
        </button>

        {/* Status online */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: dark ? 'rgba(22,163,74,0.08)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}`, borderRadius: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} className="anim-pulse" />
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>online</span>
        </div>

      </div>
    </div>
  )
}