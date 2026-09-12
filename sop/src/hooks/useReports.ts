import { useEffect, useState, useCallback } from 'react'

export type ReportStatus = 'pending' | 'awaiting_verification' | 'verified' | 'rejected'

export interface Report {
  id: string
  location: string
  stream: string
  submittedBy: string
  cleanerName: string | null
  status: ReportStatus
  submittedAt: string
}

const STORAGE_KEY = 'reports_store'

const defaultReports: Report[] = [
  { id: 'RPT-241', location: 'Anna Nagar, 4th Ave', stream: 'Plastic', submittedBy: 'Priya Sharma', cleanerName: null, status: 'pending', submittedAt: 'Aug 12, 2026' },
  { id: 'RPT-238', location: 'Velachery Main Rd', stream: 'Organic', submittedBy: 'Priya Sharma', cleanerName: 'Karthik Raj', status: 'verified', submittedAt: 'Aug 09, 2026' },
  { id: 'RPT-231', location: 'T Nagar Bus Stand', stream: 'Paper', submittedBy: 'Priya Sharma', cleanerName: null, status: 'pending', submittedAt: 'Aug 05, 2026' },
]

function load(): Report[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : defaultReports
}

const listeners: (() => void)[] = []
function notify() {
  listeners.forEach((fn) => fn())
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>(() => load())

  useEffect(() => {
    const handler = () => setReports(load())
    listeners.push(handler)
    return () => {
      const idx = listeners.indexOf(handler)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  const save = (next: Report[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setReports(next)
    notify()
  }

  const addReport = useCallback((location: string, stream: string, submittedBy: string) => {
    const current = load()
    const id = `RPT-${Math.floor(200 + Math.random() * 700)}`
    const next: Report[] = [
      { id, location, stream, submittedBy, cleanerName: null, status: 'pending', submittedAt: 'Just now' },
      ...current,
    ]
    save(next)
  }, [])

  // Cleaner marks a report as collected — moves it to awaiting_verification, no credits yet
  const markCollected = useCallback((id: string, cleanerName: string) => {
    const current = load()
    const next = current.map((r) => (r.id === id ? { ...r, status: 'awaiting_verification' as ReportStatus, cleanerName } : r))
    save(next)
  }, [])

  // Admin approves — this is the ONLY place status becomes 'verified'
  const approve = useCallback((id: string) => {
    const current = load()
    const next = current.map((r) => (r.id === id ? { ...r, status: 'verified' as ReportStatus } : r))
    save(next)
  }, [])

  const reject = useCallback((id: string) => {
    const current = load()
    const next = current.map((r) => (r.id === id ? { ...r, status: 'rejected' as ReportStatus } : r))
    save(next)
  }, [])

  return { reports, addReport, markCollected, approve, reject }
}