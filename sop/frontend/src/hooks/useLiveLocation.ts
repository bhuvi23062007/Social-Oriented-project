import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { distanceM } from '../lib/route'

export type LocStatus = 'asking' | 'ok' | 'denied' | 'unavailable'

export interface LivePos {
  lat: number
  lng: number
  heading: number | null
  accuracy: number
  speed: number | null
}

const bearing = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (d: number) => (d * Math.PI) / 180
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// live GPS + keeps the server copy fresh. Recovers by itself when location is switched off and on again.
export function useLiveLocation(pushEveryMs = 10000) {
  const [pos, setPos] = useState<LivePos | null>(null)
  const [status, setStatus] = useState<LocStatus>('asking')
  const [synced, setSynced] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const statusRef = useRef<LocStatus>('asking')
  const lastPush = useRef(0)
  const prev = useRef<{ lat: number; lng: number } | null>(null)
  const lastHeading = useRef<number | null>(null)

  const update = (s: LocStatus) => {
    statusRef.current = s
    setStatus(s)
  }

  const retry = () => {
    lastPush.current = 0
    setAttempt((n) => n + 1)
  }

  // GPS watcher (restarted whenever attempt changes)
  useEffect(() => {
    if (!navigator.geolocation) {
      update('unavailable')
      return
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        update('ok')
        const cur = { lat: p.coords.latitude, lng: p.coords.longitude }

        // heading: device value, else work it out from movement
        let h = typeof p.coords.heading === 'number' && !Number.isNaN(p.coords.heading) ? p.coords.heading : null
        if (prev.current) {
          const moved = distanceM(prev.current, cur)
          if (h == null && moved > 5) h = bearing(prev.current, cur)
          if (moved > 5) prev.current = cur
        } else {
          prev.current = cur
        }
        if (h != null) lastHeading.current = h

        setPos({ ...cur, heading: lastHeading.current, accuracy: p.coords.accuracy, speed: p.coords.speed })

        if (Date.now() - lastPush.current >= pushEveryMs) {
          lastPush.current = Date.now()
          api
            .patch('/reports/cleaner/location', { latitude: cur.lat, longitude: cur.lng })
            .then(() => setSynced((n) => n + 1))
            .catch(() => {
              lastPush.current = 0
            })
        }
      },
      (err) => update(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [attempt, pushEveryMs])

  // permission toggled in the browser, or still failing: try again
  useEffect(() => {
    let perm: PermissionStatus | undefined
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((p) => {
        perm = p
        p.onchange = () => {
          lastPush.current = 0
          setAttempt((n) => n + 1)
        }
      })
      .catch(() => {})

    const timer = setInterval(() => {
      if (statusRef.current !== 'ok') setAttempt((n) => n + 1)
    }, 10000)

    return () => {
      clearInterval(timer)
      if (perm) perm.onchange = null
    }
  }, [])

  const error =
    status === 'denied'
      ? 'Location is blocked. Allow it in your browser to navigate.'
      : status === 'unavailable'
        ? "Can't get your location. Turn on GPS / location services."
        : ''

  return { pos, status, error, synced, retry }
}