import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState(() => {
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
