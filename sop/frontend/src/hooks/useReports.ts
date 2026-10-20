import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { WasteType } from '../lib/waste'

export type ReportStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'CLEANING_COMPLETED' | 'RESOLVED' | 'REJECTED'
export type Scope = 'mine' | 'all' | 'team' | 'open'

export interface Report {
  id: string
  description: string
  latitude: number
  longitude: number
  wasteType: WasteType
  distanceKm?: number
  status: ReportStatus
  reporterId: string
  createdAt: string
  images: { url: string; type?: 'BEFORE' | 'AFTER' }[]
  statusHistory: { status: ReportStatus; note?: string; changedAt: string }[]
  reporter?: { id: string; name?: string; email?: string }
  assignment?: {
    cleaningTeamId?: string | null
    cleanerId?: string | null
    cleaningTeam?: { id: string; name: string } | null
    cleaner?: { id: string; name: string } | null
  } | null
}

const URLS: Record<Scope, string> = {
  mine: '/reports/mine',
  all: '/reports',
  team: '/reports/team/mine',
  open: '/reports/open',
}

export function useReports(scope: Scope = 'mine', pollMs?: number) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get(URLS[scope])
      setReports(res.data)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    fetchReports()
    if (!pollMs) return
    const t = setInterval(() => fetchReports(true), pollMs)
    return () => clearInterval(t)
  }, [fetchReports, pollMs])

  const addReport = useCallback(
    async (description: string, latitude: number, longitude: number, imageUrl?: string, wasteType?: WasteType) => {
      await api.post('/reports', { description, latitude, longitude, imageUrl, wasteType })
      await fetchReports(true)
    },
    [fetchReports],
  )

  const updateStatus = useCallback(async (id: string, status: ReportStatus, note?: string) => {
    await api.patch(`/reports/${id}/status`, { status, note })
    await fetchReports(true)
  }, [fetchReports])

  const assignTeam = useCallback(async (id: string, cleaningTeamId: string) => {
    await api.post(`/reports/${id}/assign`, { cleaningTeamId })
    await fetchReports(true)
  }, [fetchReports])

  const accept = useCallback(async (id: string) => {
    await api.post(`/reports/${id}/accept`)
    await fetchReports(true)
  }, [fetchReports])

  const complete = useCallback(async (id: string, afterImageUrl: string) => {
    await api.post(`/reports/${id}/complete`, { afterImageUrl })
    await fetchReports(true)
  }, [fetchReports])

  return {
    reports,
    loading,
    addReport,
    updateStatus,
    assignTeam,
    accept,
    complete,
    refetch: () => fetchReports(true),
  }
}