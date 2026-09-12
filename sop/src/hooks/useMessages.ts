import { useEffect, useState, useCallback } from 'react'

export type MessageStatus = 'unread' | 'accepted' | 'in_progress' | 'done'
export type Priority = 'normal' | 'urgent'

export interface CleanerMessage {
  id: string
  cleanerName: string
  location: string
  body: string
  priority: Priority
  status: MessageStatus
  sentAt: string
}

const STORAGE_KEY = 'cleaner_messages'

const defaultMessages: CleanerMessage[] = [
  {
    id: 'MSG-001',
    cleanerName: 'Karthik Raj',
    location: 'Nungambakkam High Rd',
    body: 'Urgent cleaning required in this area. Overflowing bin reported by 3 residents. Please clean immediately.',
    priority: 'urgent',
    status: 'unread',
    sentAt: '11:05 AM',
  },
]

function load(): CleanerMessage[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : defaultMessages
}

const listeners: (() => void)[] = []
function notify() {
  listeners.forEach((fn) => fn())
}

export function useMessages() {
  const [messages, setMessages] = useState<CleanerMessage[]>(() => load())

  useEffect(() => {
    const handler = () => setMessages(load())
    listeners.push(handler)
    return () => {
      const idx = listeners.indexOf(handler)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  const save = (next: CleanerMessage[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setMessages(next)
    notify()
  }

  const sendMessage = useCallback((cleanerName: string, location: string, body: string, priority: Priority) => {
    const current = load()
    const id = `MSG-${Math.floor(100 + Math.random() * 900)}`
    save([{ id, cleanerName, location, body, priority, status: 'unread', sentAt: 'Just now' }, ...current])
  }, [])

  const updateStatus = useCallback((id: string, status: MessageStatus) => {
    const current = load()
    save(current.map((m) => (m.id === id ? { ...m, status } : m)))
  }, [])

  return { messages, sendMessage, updateStatus }
}