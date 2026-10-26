import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const DEMO_USER = {
  id: 'demo-admin',
  email: 'admin@smartschola.zm',
  name: 'SmartSchola Demo Administrator',
  full_name: 'SmartSchola Demo Administrator',
  role: 'admin',
  is_demo: true,
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  // Temporary demo authentication only. This does not call the API or database.
  const login = useCallback((newToken, user = DEMO_USER) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('smartschola_demo_mode', 'true')
    setToken(newToken)
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
    <AuthContext.Provider value={{
      token,
      currentUser,
      isAuthenticated: !!token,
      isDemoMode: localStorage.getItem('smartschola_demo_mode') === 'true',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
