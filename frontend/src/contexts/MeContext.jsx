import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const MeContext = createContext(null)
const API = import.meta.env.VITE_API_URL

export function MeProvider({ children }) {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('helpdesk_token')
    if (!token) { setLoading(false); return }

    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setMe(res.data)
        sessionStorage.setItem('helpdesk_me', JSON.stringify(res.data))
      })
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('helpdesk_token')
          sessionStorage.removeItem('helpdesk_me')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const clearMe = () => { sessionStorage.removeItem('helpdesk_me'); setMe(null) }

  return <MeContext.Provider value={{ me, loading, clearMe }}>{children}</MeContext.Provider>
}

export function useMe() { return useContext(MeContext) }