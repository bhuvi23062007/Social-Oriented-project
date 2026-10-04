import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export type MessageStatus = 'UNREAD' | 'ACCEPTED' | 'IN_PROGRESS' | 'DONE'
export type Priority = 'NORMAL' | 'URGENT'

export interface CleanerMessage {
  id: string
  location: string
  body: string
  priority: Priority
  status: MessageStatus
  createdAt: string
  cleaner?: { id: string; name: string }
}

export function useMessages(scope: 'mine' | 'all' = 'mine') {
  const [messages, setMessages] = useState<CleanerMessage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    const url = scope === 'all' ? '/messages' : '/messages/mine'
    const res = await api.get(url)
    setMessages(res.data)
    setLoading(false)
  }, [scope])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const sendMessage = useCallback(async (cleanerId: string, location: string, body: string, priority: Priority) => {
    await api.post('/messages', { cleanerId, location, body, priority })
    await fetchMessages()
  }, [fetchMessages])

  const updateStatus = useCallback(async (id: string, status: MessageStatus) => {
    await api.patch(`/messages/${id}/status`, { status })
    await fetchMessages()
  }, [fetchMessages])

  return { messages, loading, sendMessage, updateStatus, refetch: fetchMessages }
}