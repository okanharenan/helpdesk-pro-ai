import { useTheme } from '../contexts/ThemeContext'

const DARK = {
  bg:            '#0d0d0d',
  sideBg:        '#0a0a0a',
  cardBg:        '#141414',
  inputBg:       '#1c1c1c',
  border:        '#242424',
  borderLight:   '#1e1e1e',
  textPrimary:   '#f4f4f4',
  textSecondary: '#c0c0c0',  // era #aaa — mais legível
  textMuted:     '#888888',  // era #666 — mais legível
  textTiny:      '#666666',  // para labels minúsculas
  tableHead:     '#111111',
  rowHover:      '#181818',
  overlay:       'rgba(0,0,0,0.8)',
}

const LIGHT = {
  bg:            '#f2f2f2',
  sideBg:        '#ffffff',
  cardBg:        '#ffffff',
  inputBg:       '#f7f7f7',
  border:        '#e0e0e0',
  borderLight:   '#eeeeee',
  textPrimary:   '#111111',
  textSecondary: '#333333',  // era #444 — mais contraste
  textMuted:     '#666666',  // era #888 — mais contraste
  textTiny:      '#888888',
  tableHead:     '#fafafa',
  rowHover:      '#fafafa',
  overlay:       'rgba(0,0,0,0.5)',
}

export function useThemeColors() {
  const { dark } = useTheme()
  return dark ? DARK : LIGHT
}