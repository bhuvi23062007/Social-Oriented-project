import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

export interface LivePos {
  lat: number
  lng: number
  heading: number | null
  accuracy: number
}

// live GPS while the task page is open, also keeps the server copy fresh
export function useLiveLocation(pushEveryMs = 10000) {
  const [pos, setPos] = useState<LivePos | null>(null)
  const [error, setError] = useState('')
  const lastPush = useRef(0)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Location is not supported on this device')
      return
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setError('')
        setPos({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          heading: p.coords.heading,
          accuracy: p.coords.accuracy,
        })
        if (Date.now() - lastPush.current > pushEveryMs) {
          lastPush.current = Date.now()
          api
            .patch('/reports/cleaner/location', { latitude: p.coords.latitude, longitude: p.coords.longitude })
            .catch(() => {})
        }
      },
      () => setError('Allow location access to navigate'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [pushEveryMs])

  return { pos, error }
}