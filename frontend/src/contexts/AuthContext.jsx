import { createContext, useContext, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)
const API = import.meta.env.VITE_API_URL

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('helpdesk_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (userData, token) => {
    localStorage.setItem('helpdesk_user', JSON.stringify(userData))
    localStorage.setItem('helpdesk_token', token)
    setUser(userData)
  }

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password })
    login(data.user, data.token)
  }

  const forgotPassword = async (email) => {
    await axios.post(`${API}/auth/forgot-password`, { email })
  }

  const logout = () => {
    localStorage.removeItem('helpdesk_user')
    localStorage.removeItem('helpdesk_token')
    sessionStorage.removeItem('helpdesk_me')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }