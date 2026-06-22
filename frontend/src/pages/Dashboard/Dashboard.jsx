import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useThemeColors } from '../../hooks/useThemeColors'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'

const API = import.meta.env.VITE_API_URL

const STATUS = {
  OPEN:     { label: 'Aberto',       bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  DOING:    { label: 'Em andamento', bg: 'rgba(59,130,246,0.1)',  color: '#2563eb' },
  RESOLVED: { label: 'Resolvido',    bg: 'rgba(22,163,74,0.1)',   color: '#16a34a' },
  CLOSED:   { label: 'Fechado',      bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
}
const PRIORITY = {
  HIGH:   { label: 'Alta',  color: '#dc2626' },
  MEDIUM: { label: 'Média', color: '#d97706' },
  LOW:    { label: 'Baixa', color: '#6b7280' },
}
const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

function useCountUp(target, duration = 1000, active = true) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active || target === 0) { setVal(target); return }
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, active])
  return val
}

function AnimCounter({ value, suffix = '', active }) {
  const v = useCountUp(value, 1000, active)
  return <>{v}{suffix}</>
}

function SkeletonBlock({ w = '100%', h = 14, dark, radius = 4 }) {
  return <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: h, width: w, borderRadius: radius }} />
}

export default function Dashboard() {
  const { user } = useAuth()
  const { dark } = useTheme()
  const t = useThemeColors()
  const navigate = useNavigate()
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'usuário'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)
  const token = localStorage.getItem('helpdesk_token')

  useEffect(() => {
    axios.get(`${API}/tickets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setTickets(res.data); setTimeout(() => setAnimated(true), 200) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total    = tickets.length
  const open     = tickets.filter(t => t.status === 'OPEN').length
  const doing    = tickets.filter(t => t.status === 'DOING').length
  const resolved = tickets.filter(t => t.status === 'RESOLVED').length
  const closed   = tickets.filter(t => t.status === 'CLOSED').length
  const urgent   = tickets.filter(t => t.priority === 'HIGH' && t.status === 'OPEN').length
  const pct      = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0
  const recent   = [...tickets].slice(0, 5)
  const urgentTickets = tickets.filter(tk => tk.priority === 'HIGH' && tk.status === 'OPEN').slice(0, 3)

  // Dados dos últimos 7 dias
  const weekData = DAYS.map((day, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const ds = date.toLocaleDateString('pt-BR')
    const count = tickets.filter(tk => new Date(tk.createdAt).toLocaleDateString('pt-BR') === ds).length
    return { day, count }
  })
  const maxWeek = Math.max(...weekData.map(d => d.count), 1)

  // Donut SVG
  const circ = 2 * Math.PI * 38
  const rPct = total > 0 ? Math.round((resolved / total) * 100) : 0
  const dPct = total > 0 ? Math.round((doing / total) * 100) : 0
  const oPct = total > 0 ? Math.round((open / total) * 100) : 0
  const rDash = animated ? (rPct / 100) * circ : 0
  const dDash = animated ? (dPct / 100) * circ : 0
  const oDash = animated ? (oPct / 100) * circ : 0

  const now  = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  // Estilos base
  const card = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
  }

  const metrics = [
    { label: 'Total de tickets', value: total,    accent: '#16a34a', iconBg: dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', icon: 'ti-ticket',       iconColor: '#16a34a', trend: `↑ ${pct}%`,      trendBg: dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', trendColor: '#166534' },
    { label: 'Em aberto',        value: open,     accent: '#f59e0b', iconBg: dark ? 'rgba(245,158,11,0.15)' : '#fff7ed', icon: 'ti-clock',        iconColor: '#d97706', trend: urgent > 0 ? `⚠ ${urgent} urgentes` : '✓ sem urgentes', trendBg: dark ? 'rgba(245,158,11,0.12)' : '#fff7ed', trendColor: urgent > 0 ? '#9a3412' : '#166534' },
    { label: 'Em andamento',     value: doing,    accent: '#3b82f6', iconBg: dark ? 'rgba(59,130,246,0.15)' : '#eff6ff', icon: 'ti-loader',       iconColor: '#3b82f6', trend: 'ativos agora',  trendBg: dark ? 'rgba(59,130,246,0.12)' : '#eff6ff', trendColor: '#1e40af' },
    { label: 'Resolvidos',       value: resolved, accent: '#16a34a', iconBg: dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', icon: 'ti-circle-check', iconColor: '#16a34a', trend: `+ ${closed} fechados`, trendBg: dark ? 'rgba(22,163,74,0.12)' : '#f0fdf4', trendColor: '#166534' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar
          title="Dashboard"
          subtitle={`Visão geral · ${now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        />

        <div className="anim-fade" style={{ padding: 20, overflowY: 'auto', flex: 1 }}>

          {/* Saudação */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary }}>
                {greeting}, {firstName} 👋
              </div>
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>
                {loading ? 'Carregando dados...' : urgent > 0
                  ? <>Você tem <span style={{ color: '#dc2626', fontWeight: 600 }}>{urgent} ticket{urgent > 1 ? 's' : ''} urgente{urgent > 1 ? 's' : ''}</span> aguardando atenção</>
                  : `Tudo sob controle — ${total} ticket${total !== 1 ? 's' : ''} no sistema`}
              </div>
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, background: t.cardBg, border: `1px solid ${t.border}`, padding: '7px 13px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 6, boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
              <i className="ti ti-calendar" style={{ fontSize: 13 }} />
              {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* 4 Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
            {loading ? [1,2,3,4].map(i => (
              <div key={i} style={{ ...card, padding: 16 }}>
                <SkeletonBlock w={36} h={36} dark={dark} radius={9} />
                <div style={{ marginTop: 12, marginBottom: 8 }}><SkeletonBlock w={90} h={11} dark={dark} /></div>
                <SkeletonBlock w={60} h={28} dark={dark} />
                <div style={{ marginTop: 8 }}><SkeletonBlock w={80} h={20} dark={dark} radius={99} /></div>
              </div>
            )) : metrics.map((m, i) => (
              <div key={m.label}
                className={`hover-lift anim-fade anim-d${i+1}`}
                style={{ ...card, padding: '16px', position: 'relative', overflow: 'hidden' }}>
                {/* Accent top bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${m.accent}, transparent)`, borderRadius: '12px 12px 0 0' }} />
                {/* Gradient circle bg */}
                <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: m.accent, opacity: 0.05 }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: m.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${m.icon}`} style={{ fontSize: 18, color: m.iconColor }} />
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: m.trendBg, color: m.trendColor, fontWeight: 500 }}>
                    {m.trend}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: t.textPrimary, lineHeight: 1 }}>
                  <AnimCounter value={m.value} active={animated} />
                </div>
              </div>
            ))}
          </div>

          {/* Linha 2: Gráfico barras + Alertas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 12, marginBottom: 14 }}>

            {/* Gráfico barras */}
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>Tickets — últimos 7 dias</span>
                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: dark ? 'rgba(22,163,74,0.12)' : '#f0fdf4', color: '#16a34a', fontWeight: 500, border: `1px solid ${dark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}` }}>
                  Semana atual
                </span>
              </div>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
                  {[1,2,3,4,5,6,7].map(i => <div key={i} style={{ flex: 1 }}><SkeletonBlock h={[40,70,55,90,80,30,15][i-1]} dark={dark} /></div>)}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, padding: '0 2px' }}>
                  {weekData.map((d, i) => {
                    const barH = animated ? Math.max(Math.round((d.count / maxWeek) * 95), d.count > 0 ? 10 : 3) : 3
                    const intensity = d.count / maxWeek
                    const grad = d.count === 0
                      ? t.border
                      : intensity > 0.7
                        ? 'linear-gradient(180deg,#16a34a,#22c55e)'
                        : intensity > 0.4
                          ? 'linear-gradient(180deg,#22c55e,#4ade80)'
                          : 'linear-gradient(180deg,#4ade80,#bbf7d0)'
                    return (
                      <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                        {d.count > 0 && <span style={{ fontSize: 9, color: t.textMuted, fontWeight: 600 }}>{d.count}</span>}
                        {d.count === 0 && <span style={{ fontSize: 9, color: 'transparent' }}>0</span>}
                        <div style={{ width: '80%', height: barH, background: grad, borderRadius: '5px 5px 0 0', transition: 'height 0.9s cubic-bezier(.34,1.56,.64,1)', minHeight: 3 }} />
                        <span style={{ fontSize: 9, color: t.textMuted, fontWeight: 500 }}>{d.day}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Alertas urgentes */}
            <div style={{ ...card, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>Alertas urgentes</span>
                {urgent > 0 && (
                  <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, background: '#fff5f5', padding: '3px 9px', borderRadius: 99, border: '1px solid #fecaca' }}>
                    {urgent} pendente{urgent > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3].map(i => <SkeletonBlock key={i} h={54} dark={dark} radius={10} />)}
                </div>
              ) : urgentTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 32, color: '#16a34a', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontSize: 13, color: t.textMuted }}>Nenhum alerta urgente</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {urgentTickets.map(tk => (
                    <div key={tk.id} onClick={() => navigate(`/tickets/${tk.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid #fecaca', background: dark ? 'rgba(239,68,68,0.08)' : 'linear-gradient(135deg,#fff5f5,#fef2f2)', cursor: 'pointer', transition: 'transform 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                      <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: '#dc2626', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.title}</div>
                        <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>#{tk.id} · {new Date(tk.createdAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#fee2e2', color: '#991b1b', fontWeight: 600, flexShrink: 0 }}>URGENTE</span>
                    </div>
                  ))}
                  {urgent > 3 && (
                    <button onClick={() => navigate('/tickets')}
                      style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '2px 0', fontWeight: 500 }}>
                      + {urgent - 3} mais urgentes →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Linha 3: Donut + Resumo + Feed */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: 12, marginBottom: 14 }}>

            {/* Donut chart */}
            <div style={{ ...card, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, marginBottom: 14 }}>Distribuição por status</div>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <SkeletonBlock w={100} h={100} dark={dark} radius={50} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1,2,3].map(i => <SkeletonBlock key={i} h={14} dark={dark} />)}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                    <circle cx="50" cy="50" r="38" fill="none" stroke={dark ? '#1f1f1f' : '#f1f5f9'} strokeWidth="13" />
                    {/* Resolvidos */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#16a34a" strokeWidth="13"
                      strokeDasharray={`${rDash} ${circ - rDash}`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.34,1.2,.64,1) 0.2s' }} />
                    {/* Andamento */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#3b82f6" strokeWidth="13"
                      strokeDasharray={`${dDash} ${circ - dDash}`}
                      strokeDashoffset={-(rPct / 100) * circ}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.34,1.2,.64,1) 0.5s' }} />
                    {/* Abertos */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="13"
                      strokeDasharray={`${oDash} ${circ - oDash}`}
                      strokeDashoffset={-((rPct + dPct) / 100) * circ}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.34,1.2,.64,1) 0.8s' }} />
                    <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="700" fill={t.textPrimary} fontFamily="Inter,sans-serif">
                      {animated ? `${rPct}%` : '0%'}
                    </text>
                    <text x="50" y="60" textAnchor="middle" fontSize="9" fill={t.textMuted} fontFamily="Inter,sans-serif">resolvidos</text>
                  </svg>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Resolvidos', count: resolved, color: '#16a34a', pct: rPct },
                      { label: 'Andamento',  count: doing,    color: '#3b82f6', pct: dPct },
                      { label: 'Abertos',    count: open,     color: '#f59e0b', pct: oPct },
                      { label: 'Fechados',   count: closed,   color: '#6b7280', pct: total > 0 ? Math.round((closed/total)*100) : 0 },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: t.textSecondary, flex: 1 }}>{s.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: t.textPrimary }}>{s.count}</span>
                        </div>
                        <div style={{ height: 3, background: dark ? '#1f1f1f' : '#f1f5f9', borderRadius: 99, marginLeft: 15, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: s.color, width: animated ? `${s.pct}%` : '0%', borderRadius: 99, transition: 'width 1s ease 0.3s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resumo stats */}
            <div style={{ ...card, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, marginBottom: 12 }}>Resumo do mês</div>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[1,2,3,4].map(i => <SkeletonBlock key={i} h={70} dark={dark} radius={10} />)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { val: `${pct}%`, lbl: 'Taxa resolução',  trend: '↑ melhorando', tColor: '#16a34a' },
                    { val: urgent,    lbl: 'Urgentes abertos', trend: urgent > 0 ? '⚠ atenção' : '✓ ok', tColor: urgent > 0 ? '#dc2626' : '#16a34a' },
                    { val: resolved,  lbl: 'Total resolvidos', trend: '✓ acumulado',  tColor: '#16a34a' },
                    { val: open,      lbl: 'Em fila',          trend: 'aguardando',   tColor: '#d97706' },
                  ].map((s, i) => (
                    <div key={s.lbl}
                      style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px', textAlign: 'center', transition: 'all 0.15s', cursor: 'default' }}
                      onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(22,163,74,0.08)' : '#f0fdf4'; e.currentTarget.style.borderColor = '#bbf7d0' }}
                      onMouseLeave={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : '#f8fafc'; e.currentTarget.style.borderColor = t.border }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: t.textPrimary, lineHeight: 1 }}>
                        <AnimCounter value={typeof s.val === 'number' ? s.val : 0} active={animated} suffix={typeof s.val === 'string' && s.val.includes('%') ? '%' : ''} />
                      </div>
                      <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4, fontWeight: 500 }}>{s.lbl}</div>
                      <div style={{ fontSize: 10, color: s.tColor, marginTop: 5, fontWeight: 500 }}>{s.trend}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feed atividade */}
            <div style={{ ...card, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, marginBottom: 12 }}>Atividade recente</div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <SkeletonBlock w={8} h={8} dark={dark} radius={99} />
                      <div style={{ flex: 1 }}><SkeletonBlock h={12} dark={dark} /></div>
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: t.textMuted, fontSize: 13 }}>Nenhuma atividade ainda</div>
              ) : (
                <div>
                  {recent.map((tk, i) => {
                    const dotColor = tk.status === 'RESOLVED' ? '#16a34a' : tk.status === 'DOING' ? '#3b82f6' : tk.priority === 'HIGH' ? '#dc2626' : '#d97706'
                    const isLast = i === recent.length - 1
                    return (
                      <div key={tk.id} onClick={() => navigate(`/tickets/${tk.id}`)}
                        style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 10, borderBottom: isLast ? 'none' : `1px solid ${t.borderLight}`, marginBottom: isLast ? 0 : 10, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 3 }} />
                          {!isLast && <div style={{ width: 1, flex: 1, background: t.borderLight, marginTop: 4 }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5 }}>
                            Ticket <strong style={{ color: t.textPrimary }}>#{tk.id}</strong> — {tk.title}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: t.textMuted, background: dark ? '#1a1a1a' : '#f8fafc', padding: '2px 7px', borderRadius: 99, border: `1px solid ${t.border}`, height: 'fit-content', flexShrink: 0, marginTop: 2 }}>
                          {new Date(tk.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tabela tickets recentes */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>Tickets recentes</span>
              <button onClick={() => navigate('/tickets')}
                style={{ fontSize: 12, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Ver todos →
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3,4].map(i => <SkeletonBlock key={i} h={44} dark={dark} radius={8} />)}
              </div>
            ) : recent.length === 0 ? (
              <div style={{ textAlign: 'center', fontSize: 13, color: t.textMuted, padding: '30px 0' }}>Nenhum ticket ainda</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px 110px 110px', gap: 12, padding: '10px 16px', background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: '0.02em' }}>
                  <span>ID</span><span>Título</span><span>Status</span><span>Prioridade</span><span>Abertura</span>
                </div>
                {recent.map((tk, i) => (
                  <div key={tk.id}
                    onClick={() => navigate(`/tickets/${tk.id}`)}
                    className={`anim-fade anim-d${Math.min(i+1,5)}`}
                    style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px 110px 110px', gap: 12, padding: '13px 16px', borderTop: `1px solid ${t.borderLight}`, alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>#{tk.id}</span>
                    <span style={{ color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>{tk.title}</span>
                    <span>
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, fontWeight: 500, background: STATUS[tk.status]?.bg, color: STATUS[tk.status]?.color }}>
                        {STATUS[tk.status]?.label}
                      </span>
                    </span>
                    <span style={{ fontSize: 12, color: PRIORITY[tk.priority]?.color, fontWeight: 600 }}>{PRIORITY[tk.priority]?.label}</span>
                    <span style={{ fontSize: 12, color: t.textMuted }}>{new Date(tk.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}