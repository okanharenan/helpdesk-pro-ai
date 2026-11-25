import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useSocket } from '../../contexts/SocketContext'
import { useState, useEffect, useRef } from 'react'

// Ícone e cor de cada tipo de notificação
const TYPE_META = {
  ASSIGNED:       { icon: 'ti-user-check',      color: '#16a34a' },
  UNASSIGNED:     { icon: 'ti-user-minus',      color: '#6b7280' },
  TAKEN:          { icon: 'ti-hand-grab',       color: '#2563eb' },
  STATUS_CHANGED: { icon: 'ti-refresh',         color: '#2563eb' },
  COMMENT:        { icon: 'ti-message-circle',  color: '#7c3aed' },
}
const metaFor = n =>
  n.title?.includes('urgente')
    ? { icon: 'ti-alert-triangle', color: '#dc2626' }
    : TYPE_META[n.type] || { icon: 'ti-bell', color: '#6b7280' }

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
  const notifRef = useRef(null)
  // Notificações vêm do servidor (ver SocketContext) e chegam em tempo real
  const {
    notifications = [],
    notifUnread = 0,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    toast,
    dismissToast,
  } = useSocket() || {}
  const [tab, setTab] = useState('ALL')          // 'ALL' | 'UNREAD'
  const [justMarked, setJustMarked] = useState(false) // feedback ao marcar tudo como lido

  const bg      = dark ? '#0f0f0f' : '#ffffff'
  const border  = dark ? '#1f1f1f' : '#e5e7eb'
  const text    = dark ? '#f4f4f4' : '#111111'
  const muted   = dark ? '#666666' : '#9ca3af'
  const sec     = dark ? '#c0c0c0' : '#374151'
  const inputBg = dark ? '#1a1a1a' : '#f9fafb'

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const notifs = notifications
  const isRead = n => !!n.readAt
  const unread = notifUnread
  const unreadLoaded = notifs.filter(n => !isRead(n)).length
  const allRead = notifs.length > 0 && unread === 0
  const visibleNotifs = tab === 'UNREAD' ? notifs.filter(n => !isRead(n)) : notifs

  // Ao abrir o sino, busca de novo (garante a lista atualizada). Abrir NÃO marca nada como lido.
  const handleOpenNotif = () => {
    if (!showNotif) refreshNotifications?.()
    setShowNotif(v => !v)
    setJustMarked(false)
  }

  const handleMarkOneRead = (e, id) => {
    e.stopPropagation()
    markNotificationRead?.(id)
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead?.()
    setJustMarked(true)
    setTimeout(() => setJustMarked(false), 2500)
  }

  const handleOpenTicket = n => {
    markNotificationRead?.(n.id)
    if (n.ticketId) navigate(`/tickets/${n.ticketId}`)
    setShowNotif(false)
  }

  const handleOpenToast = () => {
    if (!toast) return
    markNotificationRead?.(toast.id)
    if (toast.ticketId) navigate(`/tickets/${toast.ticketId}`)
    dismissToast?.()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: bg, borderBottom: `1px solid ${border}`, fontFamily: "'Inter', system-ui, sans-serif", flexShrink: 0, boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>

      {/* Aviso flutuante de notificação nova (tempo real) */}
      {toast && (
        <div role="status" className="anim-slide" onClick={handleOpenToast}
          style={{ position: 'fixed', top: 68, right: 20, zIndex: 1000, width: 320, maxWidth: 'calc(100vw - 40px)', display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${metaFor(toast).color}`, borderRadius: 10, boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${metaFor(toast).color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${metaFor(toast).icon}`} style={{ fontSize: 15, color: metaFor(toast).color }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 2 }}>{toast.title}</div>
            {toast.body && <div style={{ fontSize: 11, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.body}</div>}
          </div>
          <button onClick={e => { e.stopPropagation(); dismissToast?.() }} aria-label="Fechar aviso"
            style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>
            ✕
          </button>
        </div>
      )}

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
              <div className="anim-pulse"
                style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, padding: '0 4px', background: '#dc2626', color: '#fff', borderRadius: 99, border: `2px solid ${bg}`, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'content-box' }}>
                {unread > 9 ? '9+' : unread}
              </div>
            )}
          </button>

          {showNotif && (
            <div className="anim-slide" style={{ position: 'absolute', right: 0, top: 44, width: 320, background: dark ? '#141414' : '#fff', border: `1px solid ${border}`, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: text }}>Notificações</span>
                  {unread > 0 ? (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>
                      {unread} não lida{unread > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 8px', borderRadius: 99, background: dark ? 'rgba(22,163,74,0.12)' : '#dcfce7', color: '#16a34a', fontWeight: 600 }}>
                      <i className="ti ti-checks" style={{ fontSize: 11 }} aria-hidden="true" />
                      tudo lido
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {notifs.length > 0 && (
                    <button onClick={handleMarkAllRead} disabled={allRead}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: allRead ? muted : '#16a34a', background: 'none', border: 'none', cursor: allRead ? 'default' : 'pointer', fontWeight: 500, padding: 0 }}>
                      <i className={`ti ${allRead ? 'ti-checks' : 'ti-check'}`} style={{ fontSize: 13 }} aria-hidden="true" />
                      {allRead ? 'tudo lido' : 'marcar tudo como lido'}
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)}
                    style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Confirmação ao marcar tudo como lido */}
              {justMarked && (
                <div role="status" className="anim-slide"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: dark ? 'rgba(22,163,74,0.12)' : '#f0fdf4', borderBottom: `1px solid ${border}`, fontSize: 12, fontWeight: 500, color: '#16a34a' }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 15 }} aria-hidden="true" />
                  Todas as notificações foram marcadas como lidas
                </div>
              )}

              {/* Abas */}
              {notifs.length > 0 && (
                <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: `1px solid ${border}` }}>
                  {[
                    { key: 'ALL', label: 'Todas', count: notifs.length },
                    { key: 'UNREAD', label: 'Não lidas', count: unreadLoaded },
                  ].map(tb => {
                    const active = tab === tb.key
                    return (
                      <button key={tb.key} onClick={() => setTab(tb.key)}
                        style={{ fontSize: 11, fontWeight: active ? 600 : 500, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: active ? (dark ? 'rgba(22,163,74,0.14)' : '#f0fdf4') : 'transparent', color: active ? '#16a34a' : muted }}>
                        {tb.label} ({tb.count})
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Lista */}
              {notifs.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <i className="ti ti-bell-off" style={{ fontSize: 32, color: muted, display: 'block', marginBottom: 10 }} aria-hidden="true" />
                  <div style={{ fontSize: 13, color: text, fontWeight: 500, marginBottom: 4 }}>Tudo em dia</div>
                  <div style={{ fontSize: 12, color: muted }}>Nenhuma notificação no momento</div>
                </div>
              ) : visibleNotifs.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 32, color: '#16a34a', display: 'block', marginBottom: 10 }} aria-hidden="true" />
                  <div style={{ fontSize: 13, color: text, fontWeight: 500, marginBottom: 4 }}>Nenhuma notificação não lida</div>
                  <div style={{ fontSize: 12, color: muted }}>Você já viu tudo por aqui</div>
                </div>
              ) : (
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {visibleNotifs.map((n, i) => {
                    const read = isRead(n)
                    const meta = metaFor(n)
                    const rowBg = read ? 'transparent' : (dark ? 'rgba(22,163,74,0.07)' : '#f0fdf4')
                    const hoverBg = dark ? '#1a1a1a' : '#f9fafb'
                    return (
                      <div key={n.id}
                        onClick={() => handleOpenTicket(n)}
                        style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: i < visibleNotifs.length - 1 ? `1px solid ${border}` : 'none', cursor: 'pointer', background: rowBg, transition: 'background 0.12s', borderLeft: `3px solid ${read ? 'transparent' : '#16a34a'}` }}
                        onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: read ? (dark ? '#1f1f1f' : '#f3f4f6') : `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, opacity: read ? 0.7 : 1 }}>
                          <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: read ? muted : meta.color }} aria-hidden="true" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, opacity: read ? 0.65 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: read ? 400 : 700, color: read ? sec : text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{n.title}</span>
                            {!read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />}
                          </div>
                          <div style={{ fontSize: 11, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, color: muted, background: dark ? '#1f1f1f' : '#f3f4f6', padding: '2px 7px', borderRadius: 99, border: `1px solid ${border}`, height: 'fit-content' }}>
                            {timeAgo(n.createdAt)}
                          </span>
                          {read ? (
                            <span title="Lida" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#16a34a', fontWeight: 500 }}>
                              <i className="ti ti-checks" style={{ fontSize: 12 }} aria-hidden="true" />
                              lida
                            </span>
                          ) : (
                            <button onClick={e => handleMarkOneRead(e, n.id)} title="Marcar como lida"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#16a34a', background: 'none', border: `1px solid ${dark ? 'rgba(22,163,74,0.3)' : '#bbf7d0'}`, borderRadius: 99, padding: '1px 7px', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>
                              <i className="ti ti-check" style={{ fontSize: 11 }} aria-hidden="true" />
                              marcar lida
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
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