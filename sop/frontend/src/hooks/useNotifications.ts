import { useEffect, useState, useCallback } from 'react'

export interface Notification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}

type Scope = 'user' | 'cleaner' | 'admin'

const defaults: Record<Scope, Notification[]> = {
  user: [
    { id: 'n1', title: 'Report verified', body: 'RPT-238 was verified — +20 credits added.', time: '2h ago', read: false },
    { id: 'n2', title: 'Reward available', body: 'Community Gift is now redeemable at 250 points.', time: '3d ago', read: true },
  ],
  cleaner: [
    { id: 'n1', title: 'New task in queue', body: 'A new report near Velachery is open for pickup.', time: '1h ago', read: false },
  ],
  admin: [
    { id: 'n1', title: 'New report submitted', body: 'RPT-241 was submitted by Priya Sharma.', time: '30m ago', read: false },
  ],
}

function load(scope: Scope): Notification[] {
  const stored = localStorage.getItem(`notifications_${scope}`)
  return stored ? JSON.parse(stored) : defaults[scope]
}

const listeners: Record<string, (() => void)[]> = {}
function notify(key: string) {
  ;(listeners[key] || []).forEach((fn) => fn())
}

export function useNotifications(scope: Scope) {
  const [items, setItems] = useState<Notification[]>(() => load(scope))

  useEffect(() => {
    const key = `notifications_${scope}`
    const handler = () => setItems(load(scope))
    listeners[key] = listeners[key] || []
    listeners[key].push(handler)
    return () => {
      listeners[key] = listeners[key].filter((fn) => fn !== handler)
    }
  }, [scope])

  const markRead = useCallback((id: string) => {
    const key = `notifications_${scope}`
    const current = load(scope)
    const next = current.map((n) => (n.id === id ? { ...n, read: true } : n))
    localStorage.setItem(key, JSON.stringify(next))
    setItems(next)
    notify(key)
  }, [scope])

  const push = useCallback((title: string, body: string) => {
    const key = `notifications_${scope}`
    const current = load(scope)
    const next = [{ id: `${Date.now()}`, title, body, time: 'Just now', read: false }, ...current]
    localStorage.setItem(key, JSON.stringify(next))
    setItems(next)
    notify(key)
  }, [scope])

  return { items, unreadCount: items.filter((n) => !n.read).length, markRead, push }
}