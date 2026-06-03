import { useState, useEffect } from 'react'
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

function SkeletonBlock({ w = '100%', h = 14, dark }) {
  return <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: h, width: w, borderRadius: 4 }} />
}

export default function Dashboard() {
  const { user } = useAuth()
  const { dark } = useTheme()
  const t = useThemeColors()
  const navigate = useNavigate()
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'usuário'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [barsReady, setBarsReady] = useState(false)

  const token = localStorage.getItem('helpdesk_token')

  useEffect(() => {
    axios.get(`${API}/tickets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setTickets(res.data); setTimeout(() => setBarsReady(true), 150) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total    = tickets.length
  const open     = tickets.filter(t => t.status === 'OPEN').length
  const doing    = tickets.filter(t => t.status === 'DOING').length
  const resolved = tickets.filter(t => t.status === 'RESOLVED').length
  const closed   = tickets.filter(t => t.status === 'CLOSED').length
  const urgent   = tickets.filter(t => t.priority === 'HIGH' && t.status === 'OPEN').length
  const pct      = total > 0 ? Math.round((resolved / total) * 100) : 0
  const recent   = [...tickets].slice(0, 6)
  const mx       = Math.max(open, doing, resolved, 1)

  // Distribui tickets nos últimos 7 dias baseado em createdAt real
  const weekData = DAYS.map((day, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toLocaleDateString('pt-BR')
    const count = tickets.filter(tk => new Date(tk.createdAt).toLocaleDateString('pt-BR') === dateStr).length
    return { day, count }
  })
  const maxWeek = Math.max(...weekData.map(d => d.count), 1)

  // Tickets urgentes para alertas
  const urgentTickets = tickets
    .filter(tk => tk.priority === 'HIGH' && tk.status === 'OPEN')
    .slice(0, 3)

  const metrics = [
    { label: 'Total de tickets',  value: total,    accent: '#16a34a', icon: 'ti-ticket',       sub: `${pct}% resolvidos`,    subColor: '#16a34a' },
    { label: 'Em aberto',         value: open,     accent: '#f59e0b', icon: 'ti-clock',        sub: urgent > 0 ? `${urgent} urgentes` : 'sem urgentes', subColor: urgent > 0 ? '#dc2626' : '#6b7280' },
    { label: 'Em andamento',      value: doing,    accent: '#3b82f6', icon: 'ti-loader',       sub: 'ativos agora',          subColor: '#3b82f6' },
    { label: 'Resolvidos',        value: resolved, accent: '#16a34a', icon: 'ti-circle-check', sub: `+ ${closed} fechados`,  subColor: '#6b7280' },
  ]

  const card = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
  }

  const sectionTitle = {
    fontSize: 13,
    fontWeight: 600,
    color: t.textPrimary,
    marginBottom: 14,
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar title="Dashboard" subtitle={`Visão geral · ${now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`} />

        <div className="anim-fade" style={{ padding: 22, overflowY: 'auto', flex: 1 }}>

          {/* Saudação */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary }}>
                {greeting}, {firstName} 👋
              </div>
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>
                {loading ? 'Carregando dados...' : urgent > 0 ? `Você tem ${urgent} ticket${urgent > 1 ? 's' : ''} urgente${urgent > 1 ? 's' : ''} aguardando atenção` : `Tudo sob controle — ${total} ticket${total !== 1 ? 's' : ''} no sistema`}
              </div>
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, background: t.cardBg, border: `1px solid ${t.border}`, padding: '7px 14px', borderRadius: 8 }}>
              <i className="ti ti-calendar" style={{ fontSize: 13, verticalAlign: -2, marginRight: 5 }} />
              {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* 4 Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {loading ? [1,2,3,4].map(i => (
              <div key={i} style={{ ...card, padding: 16 }}>
                <SkeletonBlock w={90} h={11} dark={dark} />
                <div style={{ marginTop: 12, marginBottom: 10 }}><SkeletonBlock w={60} h={32} dark={dark} /></div>
                <SkeletonBlock w={70} h={10} dark={dark} />
              </div>
            )) : metrics.map((m, i) => (
              <div key={m.label} className={`hover-lift anim-fade anim-d${i+1}`}
                style={{ ...card, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: m.accent, borderRadius: '3px 0 0 3px' }} />
                <i className={`ti ${m.icon}`} style={{ position: 'absolute', right: 14, top: 14, fontSize: 20, color: t.border }} />
                <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 6, marginLeft: 8 }}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: t.textPrimary, lineHeight: 1, marginLeft: 8 }}>{m.value}</div>
                <div style={{ fontSize: 11, color: m.subColor, marginTop: 5, marginLeft: 8 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Linha 2: Gráfico 7 dias + Alertas urgentes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12, marginBottom: 16 }}>

            {/* Gráfico */}
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={sectionTitle}>Tickets por dia — últimos 7 dias</span>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', color: '#16a34a', fontWeight: 500 }}>Semana atual</span>
              </div>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                  {[1,2,3,4,5,6,7].map(i => <div key={i} style={{ flex: 1 }}><SkeletonBlock h={[40,70,55,90,80,30,15][i-1]} dark={dark} /></div>)}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
                  {weekData.map((d, i) => {
                    const barH = Math.max(Math.round((d.count / maxWeek) * 90), d.count > 0 ? 8 : 2)
                    const intensity = d.count / maxWeek
                    const bg = d.count === 0 ? t.border : intensity > 0.7 ? '#16a34a' : intensity > 0.4 ? '#4ade80' : '#bbf7d0'
                    return (
                      <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                        <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 500 }}>{d.count > 0 ? d.count : ''}</span>
                        <div style={{ width: '100%', height: barsReady ? barH : 2, background: bg, borderRadius: '3px 3px 0 0', transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)', minHeight: 2 }} />
                        <span style={{ fontSize: 10, color: t.textMuted }}>{d.day}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Alertas */}
            <div style={{ ...card, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={sectionTitle}>Alertas urgentes</span>
                {urgent > 0 && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>{urgent} pendente{urgent > 1 ? 's' : ''}</span>}
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2,3].map(i => <SkeletonBlock key={i} h={52} dark={dark} />)}
                </div>
              ) : urgentTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: t.textMuted, fontSize: 13 }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#16a34a' }} />
                  Nenhum alerta urgente
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {urgentTickets.map(tk => (
                    <div key={tk.id} onClick={() => navigate(`/tickets/${tk.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid #fecaca', background: dark ? 'rgba(239,68,68,0.08)' : '#fff5f5', cursor: 'pointer' }}>
                      <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: '#dc2626', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.title}</div>
                        <div style={{ fontSize: 10, color: t.textMuted, marginTop: 1 }}>#{tk.id} · {new Date(tk.createdAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: '#fee2e2', color: '#991b1b', fontWeight: 500, flexShrink: 0 }}>URGENTE</span>
                    </div>
                  ))}
                  {urgent > 3 && (
                    <button onClick={() => navigate('/tickets')} style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '4px 0' }}>
                      + {urgent - 3} mais urgentes →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Linha 3: Distribuição + Atividade recente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

            {/* Distribuição */}
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={sectionTitle}>Distribuição de tickets</div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <SkeletonBlock w={76} h={10} dark={dark} />
                      <div style={{ flex: 1 }}><SkeletonBlock h={6} dark={dark} /></div>
                      <SkeletonBlock w={20} h={10} dark={dark} />
                    </div>
                  ))}
                </div>
              ) : total === 0 ? (
                <div style={{ textAlign: 'center', fontSize: 13, color: t.textMuted, padding: '20px 0' }}>Nenhum ticket ainda</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Abertos',     val: open,     pct: Math.round((open/mx)*100),     color: '#dc2626', bg: 'rgba(239,68,68,0.1)' },
                    { label: 'Andamento',   val: doing,    pct: Math.round((doing/mx)*100),    color: '#2563eb', bg: 'rgba(59,130,246,0.1)' },
                    { label: 'Resolvidos',  val: resolved, pct: Math.round((resolved/mx)*100), color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
                    { label: 'Fechados',    val: closed,   pct: Math.round((closed/mx)*100),   color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
                  ].map((b, i) => (
                    <div key={b.label} className={`anim-fade anim-d${i+1}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: t.textMuted, width: 80, flexShrink: 0 }}>{b.label}</span>
                      <div style={{ flex: 1, height: 8, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: b.color, width: barsReady ? `${b.pct}%` : '0%', transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary, width: 24, textAlign: 'right', flexShrink: 0 }}>{b.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Atividade recente */}
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={sectionTitle}>Atividade recente</div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <SkeletonBlock w={7} h={7} dark={dark} />
                      <div style={{ flex: 1 }}><SkeletonBlock h={11} dark={dark} /></div>
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: 13, color: t.textMuted, padding: '20px 0' }}>Nenhuma atividade ainda</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recent.map((tk, i) => {
                    const dotColor = tk.status === 'RESOLVED' ? '#16a34a' : tk.status === 'DOING' ? '#2563eb' : tk.priority === 'HIGH' ? '#dc2626' : '#d97706'
                    return (
                      <div key={tk.id} className={`anim-fade anim-d${Math.min(i+1,5)}`}
                        onClick={() => navigate(`/tickets/${tk.id}`)}
                        style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${t.borderLight}`, cursor: 'pointer', alignItems: 'flex-start' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, marginTop: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5 }}>
                            Ticket <strong style={{ color: t.textPrimary }}>#{tk.id}</strong> — {tk.title}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: t.textMuted, flexShrink: 0, marginTop: 2 }}>
                          {new Date(tk.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Linha 4: Tempo médio + Tickets recentes */}
          <div style={{ ...card, padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={sectionTitle}>Resumo de status</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', color: '#16a34a', fontWeight: 500 }}>Este mês</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: 'Taxa de resolução', value: `${pct}%`, trend: '↑', trendColor: '#16a34a', sub: 'vs mês anterior' },
                { label: 'Tickets urgentes',  value: urgent,    trend: urgent > 0 ? '⚠' : '✓', trendColor: urgent > 0 ? '#dc2626' : '#16a34a', sub: 'em aberto agora' },
                { label: 'Total resolvidos',  value: resolved,  trend: '✓', trendColor: '#16a34a', sub: 'acumulado' },
                { label: 'Sem agente',        value: tickets.filter(tk => tk.status === 'OPEN').length, trend: tickets.filter(tk=>tk.status==='OPEN').length > 5 ? '⚠' : '✓', trendColor: tickets.filter(tk=>tk.status==='OPEN').length > 5 ? '#d97706' : '#16a34a', sub: 'aguardando' },
              ].map((s, i) => (
                <div key={s.label} style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: t.textPrimary }}>{loading ? '—' : s.value}</div>
                  <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: s.trendColor, marginTop: 4 }}>{s.trend} {s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela tickets recentes */}
          <div style={{ ...card, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={sectionTitle}>Tickets recentes</span>
              <button onClick={() => navigate('/tickets')}
                style={{ fontSize: 12, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Ver todos →
              </button>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3,4].map(i => <SkeletonBlock key={i} h={44} dark={dark} />)}
              </div>
            ) : recent.length === 0 ? (
              <div style={{ textAlign: 'center', fontSize: 13, color: t.textMuted, padding: '20px 0' }}>Nenhum ticket ainda</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 140px 110px 110px', gap: 12, padding: '8px 12px', background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius: 6, fontSize: 11, color: t.textMuted, fontWeight: 500, marginBottom: 4 }}>
                  <span>ID</span><span>Título</span><span>Status</span><span>Prioridade</span><span>Abertura</span>
                </div>
                {recent.map((tk, i) => (
                  <div key={tk.id}
                    onClick={() => navigate(`/tickets/${tk.id}`)}
                    className={`anim-fade anim-d${Math.min(i+1,5)}`}
                    style={{ display: 'grid', gridTemplateColumns: '70px 1fr 140px 110px 110px', gap: 12, padding: '12px 12px', borderBottom: `1px solid ${t.borderLight}`, alignItems: 'center', cursor: 'pointer', borderRadius: 4 }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>#{tk.id}</span>
                    <span style={{ color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>{tk.title}</span>
                    <span>
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, fontWeight: 500, background: STATUS[tk.status]?.bg, color: STATUS[tk.status]?.color }}>
                        {STATUS[tk.status]?.label}
                      </span>
                    </span>
                    <span style={{ fontSize: 12, color: PRIORITY[tk.priority]?.color, fontWeight: 500 }}>{PRIORITY[tk.priority]?.label}</span>
                    <span style={{ fontSize: 12, color: t.textMuted }}>{new Date(tk.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}