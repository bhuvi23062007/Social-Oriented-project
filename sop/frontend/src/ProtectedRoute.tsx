import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from './AuthContext'

export default function ProtectedRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { auth } = useAuth()

  if (!auth) return <Navigate to="/login" replace />
  if (!allow.includes(auth.role)) return <Navigate to="/login" replace />

  return <>{children}</>
}