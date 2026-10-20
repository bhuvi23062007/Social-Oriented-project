import { useEffect } from 'react'
import { api } from '../lib/api'

export function useCleanerLocation(everyMs = 60000) {
  useEffect(() => {
    if (!navigator.geolocation) return

    const send = () =>
      navigator.geolocation.getCurrentPosition(
        (p) => {
          api
            .patch('/reports/cleaner/location', {
              latitude: p.coords.latitude,
              longitude: p.coords.longitude,
            })
            .catch(() => {})
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 },
      )

    send()
    const t = setInterval(send, everyMs)
    return () => clearInterval(t)
  }, [everyMs])
}