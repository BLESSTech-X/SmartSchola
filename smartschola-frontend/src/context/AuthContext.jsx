import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiRequest } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  useEffect(() => {
    if (!token) return
    let active = true
    apiRequest('/api/auth/me', { token })
      .then(user => {
        if (!active) return
        setCurrentUser(user)
        localStorage.setItem('user', JSON.stringify(user))
      })
      .catch(() => {
        if (!active) return
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setCurrentUser(null)
      })
    return () => { active = false }
  }, [token])

  const login = useCallback((accessToken, user) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(accessToken)
    setCurrentUser(user)
  }, [])

  const updateCurrentUser = useCallback((patch) => { setCurrentUser(previous => { const next = { ...(previous || {}), ...(patch || {}) }; localStorage.setItem('user', JSON.stringify(next)); return next }) }, [])

  const logout = useCallback(() => {
    const activeToken = localStorage.getItem('token')
    if (activeToken) apiRequest('/api/auth/logout', { method: 'POST', token: activeToken }).catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setCurrentUser(null)
  }, [])

  return <AuthContext.Provider value={{ token, currentUser, isAuthenticated: Boolean(token && currentUser), login, logout, updateCurrentUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
