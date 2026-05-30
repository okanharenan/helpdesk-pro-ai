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
  OPEN:     { label: 'Aberto',       bg: 'rgba(255,77,77,0.12)',  color: '#ff4d4d' },
  DOING:    { label: 'Em andamento', bg: 'rgba(77,159,255,0.12)', color: '#4d9fff' },
  RESOLVED: { label: 'Resolvido',    bg: 'rgba(100,200,50,0.15)', color: '#5cb800' },
  CLOSED:   { label: 'Fechado',      bg: 'rgba(120,120,120,0.1)', color: '#888888' },
}
const PRIORITY = {
  HIGH:   { label: 'Alta',  color: '#ff4d4d' },
  MEDIUM: { label: 'Média', color: '#ffaa4d' },
  LOW:    { label: 'Baixa', color: '#888888' },
}

function SkeletonRow({ dark }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70px 1.8fr 150px 120px 130px', gap: 12, padding: '14px 12px', alignItems: 'center' }}>
      {[40, 200, 80, 60, 80].map((w, i) => (
        <div key={i} className={dark ? 'skeleton' : 'skeleton-light'}
          style={{ height: 14, width: w, borderRadius: 4, animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

function MetricSkeleton({ dark }) {
  return (
    <div style={{ borderRadius: 8, padding: 16, position: 'relative', overflow: 'hidden', border: '1px solid transparent' }}>
      <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 2, position: 'absolute', top: 0, left: 0, right: 0 }} />
      <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 10, width: 90, borderRadius: 3, marginBottom: 12, marginTop: 6 }} />
      <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 36, width: 60, borderRadius: 4, marginBottom: 10 }} />
      <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 10, width: 70, borderRadius: 3 }} />
    </div>
  )
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
      .then(res => {
        setTickets(res.data)
        setTimeout(() => setBarsReady(true), 100)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total    = tickets.length
  const open     = tickets.filter(t => t.status === 'OPEN').length
  const doing    = tickets.filter(t => t.status === 'DOING').length
  const resolved = tickets.filter(t => t.status === 'RESOLVED').length
  const pct      = total > 0 ? Math.round((resolved / total) * 100) : 0
  const recent   = [...tickets].slice(0, 8)
  const mx       = Math.max(open, doing, resolved, 1)

  const metrics = [
    { label: 'Total de Tickets', value: total,    color: '#b8ff57', sub: `${pct}% resolvidos` },
    { label: 'Em Andamento',     value: doing,    color: '#4d9fff', sub: 'ativos agora' },
    { label: 'Resolvidos',       value: resolved, color: '#b8ff57', sub: open > 0 ? `${open} em aberto` : 'todos resolvidos' },
  ]

  const card = { background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 8 }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'monospace' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar title="OVERVIEW" subtitle="resumo geral · helpdesk pro" />

        <div className="anim-fade" style={{ padding: 24, overflowY: 'auto', flex: 1 }}>

          {/* Saudação */}
          <div className="anim-slide" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.textPrimary, letterSpacing: '-0.3px' }}>
              Olá, {firstName} 👋
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
              {loading ? 'carregando dados...' : `${total} ticket${total !== 1 ? 's' : ''} no sistema`}
            </div>
          </div>

          {/* Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ ...card }}>
                  <MetricSkeleton dark={dark} />
                </div>
              ))
            ) : metrics.map((m, i) => (
              <div key={m.label}
                className={`hover-lift anim-fade anim-d${i+1}`}
                style={{ ...card, padding: 16, position: 'relative', overflow: 'hidden', cursor: 'default' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: m.color }} />
                <div style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, marginTop: 6 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: t.textPrimary, lineHeight: 1 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 11, color: m.color, marginTop: 6 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Gráfico distribuição */}
          <div style={{ ...card, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${t.border}` }}>
              distribuição de tickets
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 10, width: 76, borderRadius: 3 }} />
                    <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ flex: 1, height: 6, borderRadius: 2 }} />
                    <div className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 10, width: 20, borderRadius: 3 }} />
                  </div>
                ))}
              </div>
            ) : total === 0 ? (
              <div style={{ textAlign: 'center', fontSize: 12, color: t.textMuted, padding: '20px 0' }}>nenhum ticket ainda</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'abertos',    val: open,     pct: Math.round((open/mx)*100),     color: '#ff4d4d' },
                  { label: 'andamento',  val: doing,    pct: Math.round((doing/mx)*100),    color: '#4d9fff' },
                  { label: 'resolvidos', val: resolved, pct: Math.round((resolved/mx)*100), color: '#b8ff57' },
                ].map((b, i) => (
                  <div key={b.label} className={`anim-fade anim-d${i+1}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: t.textMuted, width: 76, textAlign: 'right', flexShrink: 0 }}>{b.label}</span>
                    <div style={{ flex: 1, height: 6, background: t.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: b.color, width: barsReady ? `${b.pct}%` : '0%', transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: t.textSecondary, width: 28, flexShrink: 0 }}>{b.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tickets recentes */}
          <div style={{ ...card, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${t.border}` }}>
              tickets recentes
            </div>

            {loading ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 1.8fr 150px 120px 130px', gap: 12, padding: '8px 12px', marginBottom: 4 }}>
                  {['ID','Título','Status','Prioridade','Abertura'].map(h => (
                    <div key={h} className={dark ? 'skeleton' : 'skeleton-light'} style={{ height: 10, width: '70%', borderRadius: 3 }} />
                  ))}
                </div>
                {[1,2,3,4,5].map(i => <SkeletonRow key={i} dark={dark} />)}
              </div>
            ) : recent.length === 0 ? (
              <div style={{ textAlign: 'center', fontSize: 12, color: t.textMuted, padding: '20px 0' }}>nenhum ticket ainda</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 1.8fr 150px 120px 130px', gap: 12, padding: '8px 12px', background: t.tableHead, borderRadius: 6, fontSize: 9, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                  <span>ID</span><span>Título</span><span>Status</span><span>Prioridade</span><span>Abertura</span>
                </div>
                {recent.map((tk, i) => (
                  <div key={tk.id}
                    onClick={() => navigate(`/tickets/${tk.id}`)}
                    className={`anim-fade anim-d${Math.min(i+1,5)} transition-colors`}
                    style={{ display: 'grid', gridTemplateColumns: '70px 1.8fr 150px 120px 130px', gap: 12, padding: '13px 12px', borderBottom: `1px solid ${t.borderLight}`, alignItems: 'center', fontSize: 12, cursor: 'pointer', borderRadius: 4 }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 11, color: t.textMuted }}>#{tk.id}</span>
                    <span style={{ color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>{tk.title}</span>
                    <span>
                      <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, background: STATUS[tk.status]?.bg, color: STATUS[tk.status]?.color }}>
                        {STATUS[tk.status]?.label}
                      </span>
                    </span>
                    <span style={{ fontSize: 12, color: PRIORITY[tk.priority]?.color, fontWeight: 500 }}>{PRIORITY[tk.priority]?.label}</span>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{new Date(tk.createdAt).toLocaleDateString('pt-BR')}</span>
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