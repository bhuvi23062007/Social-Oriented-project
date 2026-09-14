import { useEffect, useState, useCallback } from 'react'

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

const defaults: Record<'user' | 'cleaner', CreditState> = {
  user: {
    balance: 420,
    history: [
      { id: 'e1', reason: 'Waste report verified — RPT-238', points: 20, date: 'Aug 09, 2026' },
      { id: 'e2', reason: 'Waste report verified — RPT-231', points: 20, date: 'Aug 05, 2026' },
      { id: 'e3', reason: 'Community cleanup drive', points: 50, date: 'Jul 22, 2026' },
    ],
  },
  cleaner: {
    balance: 1240,
    history: [
      { id: 'c1', reason: 'Cleanup task verified — U-098', points: 30, date: 'Aug 08, 2026' },
      { id: 'c2', reason: 'Cleanup task verified — U-091', points: 30, date: 'Aug 02, 2026' },
      { id: 'c3', reason: 'On-time completion bonus', points: 15, date: 'Jul 30, 2026' },
    ],
  },
}

function load(role: 'user' | 'cleaner'): CreditState {
  const stored = localStorage.getItem(`credits_${role}`)
  return stored ? JSON.parse(stored) : defaults[role]
}

const listeners: Record<string, (() => void)[]> = {}
function notify(key: string) {
  ;(listeners[key] || []).forEach((fn) => fn())
}

export function useCredits(role: 'user' | 'cleaner') {
  const [state, setState] = useState<CreditState>(() => load(role))

  useEffect(() => {
    const key = `credits_${role}`
    const handler = () => setState(load(role))
    listeners[key] = listeners[key] || []
    listeners[key].push(handler)
    return () => {
      listeners[key] = listeners[key].filter((fn) => fn !== handler)
    }
  }, [role])

  const award = useCallback(
    (points: number, reason: string) => {
      const key = `credits_${role}`
      const current = load(role)
      const next: CreditState = {
        balance: current.balance + points,
        history: [{ id: `${Date.now()}`, reason, points, date: 'Just now' }, ...current.history],
      }
      localStorage.setItem(key, JSON.stringify(next))
      setState(next)
      notify(key)
    },
    [role]
  )

  return { balance: state.balance, history: state.history, award }
}