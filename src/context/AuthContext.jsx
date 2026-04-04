import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const DEMO_CREDENTIALS = {
  email: 'user@repairms.com',
  password: 'user123',
  user: {
    id: 1,
    name: 'System User',
    email: 'user@repairms.com',
    department: 'IT',
    avatar: 'SU',
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('repairms_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        setCurrentUser(user)
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem('repairms_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      setCurrentUser(DEMO_CREDENTIALS.user)
      setIsAuthenticated(true)
      localStorage.setItem('repairms_user', JSON.stringify(DEMO_CREDENTIALS.user))
      return { success: true }
    }
    return { success: false, error: 'Invalid email or password' }
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('repairms_user')
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
