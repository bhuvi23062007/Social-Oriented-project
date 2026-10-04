import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export type ReportStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'CLEANING_COMPLETED' | 'RESOLVED' | 'REJECTED'

export interface Report {
  id: string
  description: string
  latitude: number
  longitude: number
  status: ReportStatus
  reporterId: string
  createdAt: string
  images: { url: string }[]
  statusHistory: { status: ReportStatus; note?: string; changedAt: string }[]
}

export function useReports(scope: 'mine' | 'all' = 'mine') {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const url = scope === 'all' ? '/reports' : '/reports/mine'
    const res = await api.get(url)
    setReports(res.data)
    setLoading(false)
  }, [scope])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const addReport = useCallback(async (description: string, latitude: number, longitude: number, imageUrl?: string) => {
    await api.post('/reports', { description, latitude, longitude, imageUrl })
    await fetchReports()
  }, [fetchReports])

  const updateStatus = useCallback(async (id: string, status: ReportStatus, note?: string) => {
    await api.patch(`/reports/${id}/status`, { status, note })
    await fetchReports()
  }, [fetchReports])

  const assignTeam = useCallback(async (id: string, cleaningTeamId: string) => {
    await api.post(`/reports/${id}/assign`, { cleaningTeamId })
    await fetchReports()
  }, [fetchReports])

  return { reports, loading, addReport, updateStatus, assignTeam, refetch: fetchReports }
}