import { createContext, useContext, useState, type ReactNode } from 'react'
import { mockAccounts } from './data/mockAccounts'

export type Role = 'admin' | 'cleaner' | 'user'

interface AuthState {
  name: string
  email: string
  role: Role
}

interface AuthContextValue {
  auth: AuthState | null
  login: (email: string, password: string) => AuthState
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const stored = localStorage.getItem('auth')
    return stored ? JSON.parse(stored) : null
  })

  const login = (email: string, password: string): AuthState => {
    const account = mockAccounts.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    )
    if (!account) {
      throw new Error('Invalid email or password')
    }
    const next: AuthState = { name: account.name, email: account.email, role: account.role }
    setAuth(next)
    localStorage.setItem('auth', JSON.stringify(next))
    return next
  }

  const logout = () => {
    setAuth(null)
    localStorage.removeItem('auth')
  }

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}