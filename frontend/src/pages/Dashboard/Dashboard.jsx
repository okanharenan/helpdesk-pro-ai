import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'

const API = import.meta.env.VITE_API_URL

const DARK = { bg: '#0d0d0d', cardBg: '#111', border: '#1a1a1a', textPrimary: '#f0f0f0', textSecondary: '#aaaaaa', textMuted: '#555555', rowHover: '#161616', tableHead: '#1a1a1a' }
const LIGHT = { bg: '#f4f4f4', cardBg: '#ffffff', border: '#e5e5e5', textPrimary: '#111111', textSecondary: '#444444', textMuted: '#888888', rowHover: '#fafafa', tableHead: '#f9f9f9' }

const STATUS = {
  OPEN:     { label: 'Aberto',       bg: 'rgba(255,77,77,0.12)',  color: '#ff4d4d' },
  DOING:    { label: 'Em andamento', bg: 'rgba(77,159,255,0.12)', color: '#4d9fff' },
  RESOLVED: { label: 'Resolvido',    bg: 'rgba(184,255,87,0.15)', color: '#7acc00' },
  CLOSED:   { label: 'Fechado',      bg: 'rgba(100,100,100,0.1)', color: '#888888' },
}
const PRIORITY = {
  HIGH:   { label: 'Alta',  color: '#ff4d4d' },
  MEDIUM: { label: 'Média', color: '#ffaa4d' },
  LOW:    { label: 'Baixa', color: '#888888' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const t = dark ? DARK : LIGHT
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'usuário'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('helpdesk_token')

  useEffect(() => {
    axios.get(`${API}/tickets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTickets(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total     = tickets.length
  const open      = tickets.filter(t => t.status === 'OPEN').length
  const doing     = tickets.filter(t => t.status === 'DOING').length
  const resolved  = tickets.filter(t => t.status === 'RESOLVED').length
  const pct       = total > 0 ? Math.round((resolved / total) * 100) : 0
  const recent    = [...tickets].slice(0, 8)
  const mx        = Math.max(open, doing, resolved, 1)

  const metrics = [
    { label: 'Total de Tickets', value: total, color: '#b8ff57', sub: `${pct}% resolvidos` },
    { label: 'Em Andamento',     value: doing, color: '#4d9fff', sub: 'ativos agora' },
    { label: 'Resolvidos',       value: resolved, color: '#b8ff57', sub: open > 0 ? `${open} em aberto` : 'todos resolvidos' },
  ]

  return (
    <div style={{ ...styles.page, background: t.bg }}>
      <Sidebar />
      <div style={styles.main}>
        <Navbar title="OVERVIEW" subtitle="resumo geral · helpdesk pro" />
        <div style={styles.content}>

          {/* Saudação */}
          <div style={styles.greeting}>
            <div style={{ ...styles.greetingTitle, color: t.textPrimary }}>
              Olá, {firstName} 👋
            </div>
            <div style={{ ...styles.greetingSub, color: t.textMuted }}>
              {loading ? 'carregando dados...' : `${total} tickets no sistema`}
            </div>
          </div>

          {/* Métricas */}
          <div style={styles.metricsGrid}>
            {metrics.map((m) => (
              <div key={m.label} style={{ ...styles.metricCard, background: t.cardBg, border: `1px solid ${t.border}` }}>
                <div style={{ ...styles.metricBar, background: m.color }} />
                <div style={{ ...styles.metricLabel, color: t.textMuted }}>{m.label}</div>
                <div style={{ ...styles.metricValue, color: t.textPrimary }}>
                  {loading ? '—' : m.value}
                </div>
                <div style={{ ...styles.metricSub, color: m.color }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div style={{ ...styles.panel, background: t.cardBg, border: `1px solid ${t.border}` }}>
            <div style={{ ...styles.panelTitle, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>
              distribuição de tickets
            </div>
            {loading ? (
              <div style={{ ...styles.emptyState, color: t.textMuted }}>carregando...</div>
            ) : total === 0 ? (
              <div style={{ ...styles.emptyState, color: t.textMuted }}>nenhum ticket ainda</div>
            ) : (
              <div style={styles.bars}>
                {[
                  { label: 'abertos',    val: open,     pct: Math.round((open / mx) * 100),     color: '#ff4d4d' },
                  { label: 'andamento',  val: doing,    pct: Math.round((doing / mx) * 100),    color: '#4d9fff' },
                  { label: 'resolvidos', val: resolved,  pct: Math.round((resolved / mx) * 100), color: '#b8ff57' },
                ].map((b) => (
                  <div key={b.label} style={styles.barRow}>
                    <span style={{ ...styles.barLabel, color: t.textMuted }}>{b.label}</span>
                    <div style={{ ...styles.barTrack, background: t.border }}>
                      <div style={{ ...styles.barFill, width: `${b.pct}%`, background: b.color }} />
                    </div>
                    <span style={{ ...styles.barVal, color: t.textSecondary }}>{b.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tickets recentes */}
          <div style={{ ...styles.panel, background: t.cardBg, border: `1px solid ${t.border}` }}>
            <div style={{ ...styles.panelTitle, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>
              tickets recentes
            </div>
            {loading ? (
              <div style={{ ...styles.emptyState, color: t.textMuted }}>carregando...</div>
            ) : recent.length === 0 ? (
              <div style={{ ...styles.emptyState, color: t.textMuted }}>nenhum ticket ainda</div>
            ) : (
              <div style={styles.table}>
                <div style={{ ...styles.tableHead, background: t.tableHead, color: t.textMuted }}>
                  <span style={{ width: 60 }}>ID</span>
                  <span style={{ flex: 1 }}>Título</span>
                  <span style={{ width: 120 }}>Status</span>
                  <span style={{ width: 90 }}>Prioridade</span>
                  <span style={{ width: 100 }}>Abertura</span>
                </div>
                {recent.map((t2) => (
                  <div key={t2.id}
                    onClick={() => navigate(`/tickets/${t2.id}`)}
                    style={{ ...styles.tableRow, borderBottom: `1px solid ${t.border}`, cursor: 'pointer' }}>
                    <span style={{ ...styles.ticketId, color: t.textMuted }}>#{t2.id}</span>
                    <span style={{ ...styles.ticketTitle, color: t.textPrimary }}>{t2.title}</span>
                    <span>
                      <span style={{ ...styles.badge, background: STATUS[t2.status]?.bg, color: STATUS[t2.status]?.color }}>
                        {STATUS[t2.status]?.label}
                      </span>
                    </span>
                    <span style={{ fontSize: 12, color: PRIORITY[t2.priority]?.color }}>
                      {PRIORITY[t2.priority]?.label}
                    </span>
                    <span style={{ ...styles.ticketTime, color: t.textMuted }}>
                      {new Date(t2.createdAt).toLocaleDateString('pt-BR')}
                    </span>
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

const styles = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'monospace' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  content: { padding: '24px', overflowY: 'auto', flex: 1 },
  greeting: { marginBottom: 20 },
  greetingTitle: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' },
  greetingSub: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 },
  metricCard: { borderRadius: 8, padding: '16px', position: 'relative', overflow: 'hidden' },
  metricBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  metricLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
  metricValue: { fontSize: 32, fontWeight: 800, lineHeight: 1 },
  metricSub: { fontSize: 11, marginTop: 6 },
  panel: { borderRadius: 8, padding: '18px 20px', marginBottom: 16 },
  panelTitle: { fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10 },
  emptyState: { textAlign: 'center', fontSize: 12, padding: '30px 0' },
  bars: { display: 'flex', flexDirection: 'column', gap: 14 },
  barRow: { display: 'flex', alignItems: 'center', gap: 12 },
  barLabel: { fontSize: 11, width: 76, textAlign: 'right', flexShrink: 0 },
  barTrack: { flex: 1, height: 6, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2, transition: 'width 0.5s ease' },
  barVal: { fontSize: 11, fontWeight: 500, width: 28, flexShrink: 0 },
  table: { display: 'flex', flexDirection: 'column' },
  tableHead: { display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 6, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 },
  tableRow: { display: 'flex', gap: 12, padding: '11px 12px', alignItems: 'center', fontSize: 12, borderRadius: 4 },
  ticketId: { width: 60, flexShrink: 0, fontSize: 11 },
  ticketTitle: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 },
  ticketTime: { width: 100, fontSize: 11 },
  badge: { fontSize: 10, padding: '3px 9px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 },
}