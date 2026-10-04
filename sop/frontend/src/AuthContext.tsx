import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from './lib/api'

export type Role = 'ADMIN' | 'CLEANING_STAFF' | 'CITIZEN'

interface AuthState {
  userId: string
  name: string
  email: string
  role: Role
  token: string
}

interface AuthContextValue {
  auth: AuthState | null
  login: (email: string, password: string) => Promise<AuthState>
  register: (name: string, email: string, password: string) => Promise<AuthState>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function decodeToken(token: string): { sub: string; email: string; role: Role } {
  const payload = JSON.parse(atob(token.split('.')[1]))
  return payload
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const stored = localStorage.getItem('auth')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (email: string, password: string): Promise<AuthState> => {
    const res = await api.post('/auth/login', { email, password })
    const token = res.data.access_token
    const payload = decodeToken(token)

    const next: AuthState = {
      userId: payload.sub,
      name: email,
      email: payload.email,
      role: payload.role,
      token,
    }
    setAuth(next)
    localStorage.setItem('auth', JSON.stringify(next))
    return next
  }

  const register = async (name: string, email: string, password: string): Promise<AuthState> => {
    await api.post('/auth/register', { name, email, password })
    return login(email, password)
  }

  const logout = () => {
    setAuth(null)
    localStorage.removeItem('auth')
  }

  return (
    <AuthContext.Provider value={{ auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}