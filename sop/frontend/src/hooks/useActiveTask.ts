import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Report } from './useReports'

export interface ActiveTask extends Omit<Report, 'assignment'> {
  assignment: { assignedAt: string; cleanerId?: string | null }
  onSiteMeters: number
  minJobMinutes: number
}

export function useActiveTask() {
  const [task, setTask] = useState<ActiveTask | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const res = await api.get('/reports/active')
      setTask(res.data?.task ?? null)
    } catch {
      setTask(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { task, loading, refetch }
}