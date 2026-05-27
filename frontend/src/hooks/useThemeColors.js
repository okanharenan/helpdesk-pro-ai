import { useTheme } from '../contexts/ThemeContext'

const DARK = {
  bg:            '#0d0d0d',
  sideBg:        '#0a0a0a',
  cardBg:        '#111111',
  inputBg:       '#1a1a1a',
  border:        '#1f1f1f',
  borderLight:   '#252525',
  textPrimary:   '#f0f0f0',
  textSecondary: '#aaaaaa',
  textMuted:     '#666666',
  tableHead:     '#161616',
  rowHover:      '#161616',
  overlay:       'rgba(0,0,0,0.75)',
}

const LIGHT = {
  bg:            '#f2f2f2',
  sideBg:        '#ffffff',
  cardBg:        '#ffffff',
  inputBg:       '#f7f7f7',
  border:        '#e0e0e0',
  borderLight:   '#eeeeee',
  textPrimary:   '#111111',
  textSecondary: '#444444',
  textMuted:     '#888888',
  tableHead:     '#fafafa',
  rowHover:      '#fafafa',
  overlay:       'rgba(0,0,0,0.5)',
}

export function useThemeColors() {
  const { dark } = useTheme()
  return dark ? DARK : LIGHT
}