import { useEffect, useRef } from 'react'

export function useLiveEvents(onEvent: (type: string) => void) {
  const ref = useRef(onEvent)
  ref.current = onEvent

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('auth') || '{}').token
    if (!token) return
    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`)
    for (const t of ['reports:changed', 'new-request']) {
      es.addEventListener(t, () => ref.current(t))
    }
    return () => es.close()
  }, [])
}