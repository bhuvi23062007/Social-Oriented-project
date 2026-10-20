import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useActiveTask } from '../../hooks/useActiveTask'
import { useLiveLocation } from '../../hooks/useLiveLocation'
import { fetchRoute, distanceM, fmtDist, fmtMin, stepArrow, type RouteInfo } from '../../lib/route'
import { wasteLabel, wastePoints } from '../../lib/waste'
import NavMap from '../../components/NavMap'

function ActiveTask() {
  const navigate = useNavigate()
  const { task, loading } = useActiveTask()
  const { pos, error: locError } = useLiveLocation()
  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [follow, setFollow] = useState(true)
  const [fit, setFit] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const last = useRef<{ lat: number; lng: number; t: number } | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])

  // (re)calculate the route when the cleaner moves 40 m+, at most every 8 s, or every minute
  useEffect(() => {
    if (!pos || !task) return
    const l = last.current
    const age = l ? Date.now() - l.t : Infinity
    const moved = l ? distanceM(l, pos) : Infinity
    if (age < 8000 || (moved < 40 && age < 60000)) return
    last.current = { lat: pos.lat, lng: pos.lng, t: Date.now() }
    fetchRoute(pos, { lat: task.latitude, lng: task.longitude }).then((r) => r && setRoute(r))
  }, [pos, task])

  if (loading) return <p className="p-8 text-sm text-muted">Loading...</p>
  if (!task) return <Navigate to="/cleaner/urgent" replace />

  const dest = { lat: task.latitude, lng: task.longitude }
  const distM = pos ? distanceM(pos, dest) : null
  const onSite = distM != null && distM <= task.onSiteMeters
  const elapsedMin = (now - new Date(task.assignment.assignedAt).getTime()) / 60000
  const waitMin = Math.max(0, task.minJobMinutes - elapsedMin)
  const ready = onSite && waitMin === 0

  // OSRM: a step's text is what to do at its START, so the next manoeuvre is step[1]
  const next = route ? (route.steps[1] ?? route.steps[0]) : null
  const toNext = route ? (route.steps[1] ? route.steps[0].distance : route.distance) : 0

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const complete = async () => {
    if (!file || !pos) return
    setBusy(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const up = await api.post('/storage/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await api.post(`/reports/${task.id}/complete`, {
        afterImageUrl: up.data.url,
        latitude: pos.lat,
        longitude: pos.lng,
      })
      navigate('/cleaner/urgent', { replace: true })
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not complete. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const release = async () => {
    if (!window.confirm('Cancel this task? It goes back to the open requests.')) return
    try {
      await api.post(`/reports/${task.id}/release`)
      navigate('/cleaner/urgent', { replace: true })
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not cancel. Try again.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <NavMap
          dest={dest}
          me={pos}
          route={route?.coords ?? []}
          follow={follow}
          fitSignal={fit}
          onDrag={() => setFollow(false)}
        />
      </div>

      {/* turn-by-turn banner */}
      <div className="fixed left-3 right-3 top-3 z-20 mx-auto max-w-xl">
        <div className="rounded-2xl border border-line bg-ink px-4 py-3 text-paper shadow-2xl">
          {locError ? (
            <p className="text-sm">{locError}</p>
          ) : !pos ? (
            <p className="text-sm">Getting your GPS...</p>
          ) : !next ? (
            <p className="text-sm">Finding the best route...</p>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl">{stepArrow(next.type, next.modifier)}</span>
              <div>
                <p className="text-xs opacity-70">In {fmtDist(toNext)}</p>
                <p className="text-sm font-bold">{next.text}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* task sheet */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-h-[58vh] max-w-xl overflow-y-auto rounded-t-3xl border border-line bg-surface/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="label text-accent">Your task</span>
            <p className="text-base font-black">{wasteLabel(task.wasteType)}</p>
            <p className="text-sm text-muted">{task.description.split(':')[0]}</p>
          </div>
          <span className="label shrink-0 rounded-full bg-accent-soft px-3 py-1.5 text-accent">
            +{wastePoints(task.wasteType)} pts
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { v: route ? fmtDist(route.distance) : distM != null ? fmtDist(distM) : '-', l: 'To go' },
            { v: route ? fmtMin(route.duration) : '-', l: 'ETA' },
            { v: `${task.onSiteMeters} m`, l: 'Finish within' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-line bg-paper p-2.5">
              <p className="text-base font-black">{s.v}</p>
              <p className="label text-muted">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={() => setFollow(true)} className="flex-1 rounded-xl border border-line py-2 text-xs font-medium hover:border-accent">
            ◎ Recenter
          </button>
          <button
            onClick={() => {
              setFollow(false)
              setFit((n) => n + 1)
            }}
            className="flex-1 rounded-xl border border-line py-2 text-xs font-medium hover:border-accent"
          >
            Overview
          </button>
          <button onClick={release} className="flex-1 rounded-xl border border-line py-2 text-xs font-medium text-glass hover:border-glass">
            Cancel task
          </button>
        </div>

        {route && route.steps.length > 1 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-accent">
              All directions ({route.steps.length - 1})
            </summary>
            <ol className="mt-2 space-y-1.5">
              {route.steps.slice(1).map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <span>{stepArrow(s.type, s.modifier)}</span>
                  <span className="flex-1">{s.text}</span>
                  <span className="text-muted">{fmtDist(route.steps[i].distance)}</span>
                </li>
              ))}
            </ol>
          </details>
        )}

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm font-bold">Finish the job</p>
          <p className="mt-1 text-xs text-muted">
            {!pos
              ? 'Waiting for GPS...'
              : !onSite
                ? `You are ${fmtDist(distM ?? 0)} away. Get within ${task.onSiteMeters} m of the spot.`
                : waitMin > 0
                  ? `Almost there. You can finish in ${Math.ceil(waitMin)} min.`
                  : 'You are at the spot. Take an after photo.'}
          </p>

          <div className="relative mt-3 flex items-center gap-3 rounded-xl border border-dashed border-line bg-paper p-3 hover:border-accent">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={pick}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            {preview ? (
              <img src={preview} alt="After preview" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent-soft text-2xl">📷</span>
            )}
            <p className="text-sm font-medium">{preview ? 'Photo ready, tap to retake' : 'Take after-cleaning photo'}</p>
          </div>

          {error && <p className="mt-2 text-xs text-glass">{error}</p>}

          <button
            onClick={complete}
            disabled={!ready || !file || busy}
            className="mt-3 w-full rounded-xl bg-ink py-3 text-sm font-medium text-paper transition-colors hover:bg-accent hover:text-white disabled:opacity-40"
          >
            {busy ? 'Submitting...' : 'Mark Completed'}
          </button>
        </div>
      </div>
    </>
  )
}

export default ActiveTask