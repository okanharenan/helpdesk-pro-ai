import { useTheme } from '../../contexts/ThemeContext'

const DARK = { bg: '#0a0a0a', border: '#1f1f1f', textPrimary: '#f0f0f0', textMuted: '#555' }
const LIGHT = { bg: '#ffffff', border: '#e0e0e0', textPrimary: '#111111', textMuted: '#999' }

export default function Navbar({ title = 'OVERVIEW', subtitle = 'resumo geral' }) {
  const { dark } = useTheme()
  const t = dark ? DARK : LIGHT

  return (
    <div style={{ ...styles.navbar, background: t.bg, borderBottom: `1px solid ${t.border}` }}>
      <div>
        <div style={{ ...styles.title, color: t.textPrimary }}>{title}</div>
        <div style={{ ...styles.subtitle, color: t.textMuted }}>{subtitle}</div>
      </div>
      <div style={styles.right}>
        <div style={styles.statusDot} />
        <span style={{ ...styles.statusText, color: t.textMuted }}>sistema online</span>
      </div>
    </div>
  )
}

const styles = {
  navbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', fontFamily: 'monospace' },
  title: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' },
  subtitle: { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: '50%', background: '#b8ff57' },
  statusText: { fontSize: 10, letterSpacing: '0.1em' },
}