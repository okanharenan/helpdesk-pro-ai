import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60)   return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function Navbar({ title = 'Dashboard', subtitle = 'visão geral' }) {
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const [search, setSearch] = useState('')
  const [tickets, setTickets] = useState([])
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_seen') || '[]') } catch { return [] }
  })
  const notifRef = useRef(null)

  const bg      = dark ? '#0f0f0f' : '#ffffff'
  const border  = dark ? '#1f1f1f' : '#e5e7eb'
  const text    = dark ? '#f4f4f4' : '#111111'
  const muted   = dark ? '#666666' : '#9ca3af'
  const sec     = dark ? '#c0c0c0' : '#374151'
  const inputBg = dark ? '#1a1a1a' : '#f9fafb'

  const token = localStorage.getItem('helpdesk_token')

  // Busca tickets reais
  useEffect(() => {
    if (!token) return
    axios.get(`${API}/tickets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTickets(res.data))
      .catch(() => {})
  }, [])

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Gera notificações reais dos tickets
  const notifs = []

  // Urgentes abertos
  tickets
    .filter(tk => tk.priority === 'HIGH' && tk.status === 'OPEN')
    .slice(0, 2)
    .forEach(tk => notifs.push({
      id: `urgent-${tk.id}`,
      ticketId: tk.id,
      icon: 'ti-alert-triangle',
      color: '#dc2626',
      bg: dark ? 'rgba(239,68,68,0.06)' : '#fff5f5',
      leftBorder: '#dc2626',
      title: `Ticket #${tk.id} — urgente`,
      msg: tk.title,
      time: timeAgo(tk.createdAt),
    }))

  // Em andamento recentes (últimas 24h)
  tickets
    .filter(tk => tk.status === 'DOING' && (Date.now() - new Date(tk.createdAt)) < 86400000)
    .slice(0, 2)
    .forEach(tk => notifs.push({
      id: `doing-${tk.id}`,
      ticketId: tk.id,
      icon: 'ti-loader',
      color: '#2563eb',
      bg: 'transparent',
      leftBorder: 'transparent',
      title: `Ticket #${tk.id} em andamento`,
      msg: tk.title,
      time: timeAgo(tk.createdAt),
    }))

  // Resolvidos recentes (últimas 6h)
  tickets
    .filter(tk => tk.status === 'RESOLVED' && (Date.now() - new Date(tk.createdAt)) < 21600000)
    .slice(0, 1)
    .forEach(tk => notifs.push({
      id: `resolved-${tk.id}`,
      ticketId: tk.id,
      icon: 'ti-circle-check',
      color: '#16a34a',
      bg: 'transparent',
      leftBorder: 'transparent',
      title: `Ticket #${tk.id} resolvido`,
      msg: tk.title,
      time: timeAgo(tk.createdAt),
    }))

  const unread = notifs.filter(n => !seen.includes(n.id)).length

  const handleOpenNotif = () => {
    setShowNotif(v => !v)
    if (!showNotif) {
      const allIds = notifs.map(n => n.id)
      setSeen(allIds)
      localStorage.setItem('notif_seen', JSON.stringify(allIds))
    }
  }

  const handleMarkAllRead = () => {
    const allIds = notifs.map(n => n.id)
    setSeen(allIds)
    localStorage.setItem('notif_seen', JSON.stringify(allIds))
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: bg, borderBottom: `1px solid ${border}`, fontFamily: "'Inter', system-ui, sans-serif", flexShrink: 0, boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>

      {/* Título */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: text, letterSpacing: '-0.2px' }}>{title}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 1 }}>{subtitle}</div>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Busca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: inputBg, border: `1px solid ${border}`, borderRadius: 9, padding: '7px 12px', width: 200, transition: 'border-color 0.15s' }}
          onFocus={e => e.currentTarget.style.borderColor = '#16a34a'}
          onBlur={e => e.currentTarget.style.borderColor = border}>
          <i className="ti ti-search" style={{ fontSize: 14, color: muted, flexShrink: 0 }} aria-hidden="true" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { navigate('/tickets'); setSearch('') } }}
            placeholder="Buscar ticket..."
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: text, flex: 1, fontFamily: 'inherit' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
          )}
        </div>

        {/* Notificações */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={handleOpenNotif}
            style={{ width: 36, height: 36, borderRadius: 9, background: showNotif ? (dark ? 'rgba(22,163,74,0.1)' : '#f0fdf4') : inputBg, border: `1px solid ${showNotif ? '#bbf7d0' : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showNotif ? '#16a34a' : sec, transition: 'all 0.15s', position: 'relative' }}>
            <i className="ti ti-bell" style={{ fontSize: 16 }} aria-hidden="true" />
            {unread > 0 && (
              <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#dc2626', borderRadius: '50%', border: `2px solid ${bg}` }}
                className="anim-pulse" />
            )}
          </button>

          {showNotif && (
            <div className="anim-slide" style={{ position: 'absolute', right: 0, top: 44, width: 320, background: dark ? '#141414' : '#fff', border: `1px solid ${border}`, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: text }}>Notificações</span>
                  {unread > 0
                    ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>{unread} nova{unread > 1 ? 's' : ''}</span>
                    : <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: dark ? '#1f1f1f' : '#f3f4f6', color: muted, fontWeight: 500 }}>em dia</span>
                  }
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {notifs.length > 0 && (
                    <button onClick={handleMarkAllRead}
                      style={{ fontSize: 11, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                      marcar tudo como lido
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)}
                    style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Lista */}
              {notifs.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <i className="ti ti-bell-off" style={{ fontSize: 32, color: muted, display: 'block', marginBottom: 10 }} aria-hidden="true" />
                  <div style={{ fontSize: 13, color: text, fontWeight: 500, marginBottom: 4 }}>Tudo em dia</div>
                  <div style={{ fontSize: 12, color: muted }}>Nenhuma notificação no momento</div>
                </div>
              ) : (
                notifs.map((n, i) => {
                  const isNew = !seen.includes(n.id)
                  return (
                    <div key={n.id}
                      onClick={() => { navigate(`/tickets/${n.ticketId}`); setShowNotif(false) }}
                      style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: i < notifs.length - 1 ? `1px solid ${border}` : 'none', cursor: 'pointer', background: isNew ? (dark ? 'rgba(22,163,74,0.04)' : '#fafffe') : n.bg, transition: 'background 0.12s', borderLeft: `3px solid ${n.leftBorder}` }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? '#1a1a1a' : '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = isNew ? (dark ? 'rgba(22,163,74,0.04)' : '#fafffe') : n.bg}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${n.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <i className={`ti ${n.icon}`} style={{ fontSize: 15, color: n.color }} aria-hidden="true" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{n.title}</span>
                          {isNew && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 11, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.msg}</div>
                      </div>
                      <span style={{ fontSize: 10, color: muted, background: dark ? '#1f1f1f' : '#f3f4f6', padding: '2px 7px', borderRadius: 99, border: `1px solid ${border}`, height: 'fit-content', flexShrink: 0, marginTop: 2 }}>
                        {n.time}
                      </span>
                    </div>
                  )
                })
              )}

              {/* Footer */}
              <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: notifs.length > 0 ? `1px solid ${border}` : 'none' }}>
                <button onClick={() => { navigate('/tickets'); setShowNotif(false) }}
                  style={{ fontSize: 12, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Ver todos os tickets →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Novo Ticket */}
        <button onClick={() => navigate('/tickets')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', background: 'linear-gradient(135deg,#16a34a,#22c55e)', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,163,74,0.3)' }}>
          <i className="ti ti-plus" style={{ fontSize: 15 }} aria-hidden="true" />
          Novo Ticket
        </button>

        {/* Status online */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: dark ? 'rgba(22,163,74,0.08)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}`, borderRadius: 9 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} className="anim-pulse" />
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>online</span>
        </div>

      </div>
    </div>
  )
}