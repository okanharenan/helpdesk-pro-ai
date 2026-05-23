import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('helpdesk_theme') !== 'light'
  })

  const toggle = () => {
    setDark(prev => {
      localStorage.setItem('helpdesk_theme', !prev ? 'dark' : 'light')
      return !prev
    })
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}