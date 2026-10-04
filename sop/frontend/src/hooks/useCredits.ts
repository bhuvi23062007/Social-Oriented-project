import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export interface CreditEvent {
  id: string
  reason: string
  points: number
  date: string
}

interface CreditState {
  balance: number
  history: CreditEvent[]
}

export function useCredits() {
  const [state, setState] = useState<CreditState>({ balance: 0, history: [] })
  const [loading, setLoading] = useState(true)

  const fetchCredits = useCallback(async () => {
    setLoading(true)
    const res = await api.get('/rewards/mine')
    const history: CreditEvent[] = res.data.history.map((h: any) => ({
      id: h.id,
      reason: h.reason,
      points: h.points,
      date: new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    }))
    setState({ balance: res.data.balance, history })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  return { balance: state.balance, history: state.history, loading, refetch: fetchCredits }
}