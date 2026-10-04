import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const res = await api.get('/notifications/mine')
    setItems(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  return {
    items,
    unreadCount: items.filter((n) => !n.read).length,
    loading,
    markRead,
    refetch: fetchNotifications,
  }
}