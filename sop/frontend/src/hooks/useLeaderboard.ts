    import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export interface LeaderboardEntry {
  id: string
  name: string
  points: number
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    const res = await api.get('/users/leaderboard')
    setEntries(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return { entries, loading, refetch: fetchLeaderboard }
}