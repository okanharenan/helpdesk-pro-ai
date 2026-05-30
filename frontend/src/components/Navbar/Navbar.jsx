import { useTheme } from '../../contexts/ThemeContext'

export default function Navbar({ title = 'OVERVIEW', subtitle = 'resumo geral' }) {
  const { dark } = useTheme()
  const bg     = dark ? '#0a0a0a' : '#ffffff'
  const border = dark ? '#242424' : '#e0e0e0'
  const text   = dark ? '#f4f4f4' : '#111111'
  const muted  = dark ? '#888888' : '#666666'

  return (
    <div className="anim-slide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: bg, borderBottom: `1px solid ${border}`, fontFamily: 'monospace', flexShrink: 0 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: text, letterSpacing: '-0.3px' }}>{title}</div>
        <div style={{ fontSize: 9, color: muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#b8ff57' }} className="anim-pulse" />
        <span style={{ fontSize: 10, color: muted, letterSpacing: '0.1em' }}>sistema online</span>
      </div>
    </div>
  )
}