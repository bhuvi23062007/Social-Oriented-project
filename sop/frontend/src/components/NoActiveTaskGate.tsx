import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useActiveTask } from '../hooks/useActiveTask'

// cleaners with an open task are sent straight back to it
export default function NoActiveTaskGate({ children }: { children: ReactNode }) {
  const { task, loading } = useActiveTask()

  if (loading) return <p className="p-8 text-sm text-muted">Loading...</p>
  if (task) return <Navigate to="/cleaner/active" replace />

  return <>{children}</>
}