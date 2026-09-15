import { createContext, useContext, useState, type ReactNode } from 'react'

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
const API_URL = 'http://localhost:3000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const stored = localStorage.getItem('auth')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (email: string, password: string): Promise<AuthState> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Invalid email or password')
    const data = await res.json()

    const meRes = await fetch(`${API_URL}/auth/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    const me = await meRes.json()

    const next: AuthState = {
      userId: me.userId,
      name: email,
      email: me.email,
      role: me.role,
      token: data.access_token,
    }
    setAuth(next)
    localStorage.setItem('auth', JSON.stringify(next))
    return next
  }

  const register = async (name: string, email: string, password: string): Promise<AuthState> => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) throw new Error('Registration failed')
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