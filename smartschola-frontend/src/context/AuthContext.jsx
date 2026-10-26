import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    // Clear legacy client-only demo sessions so they cannot bypass API authentication.
    if (localStorage.getItem('smartschola_demo_mode') === 'true') {
      localStorage.removeItem('smartschola_demo_mode')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return null
    }
    return localStorage.getItem('token')
  })
  const [currentUser, setCurrentUser] = useState(() => {
    if (localStorage.getItem('smartschola_demo_mode') === 'true') return null
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  const login = useCallback((accessToken, user) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(accessToken)
    setCurrentUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('smartschola_demo_mode')
    setToken(null)
    setCurrentUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, currentUser, isAuthenticated: Boolean(token && currentUser), login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
