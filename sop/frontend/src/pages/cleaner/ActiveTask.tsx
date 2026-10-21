import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../lib/api'
import { compressImage } from '../../lib/image'
import { useActiveTask } from '../../hooks/useActiveTask'
import { useLiveLocation } from '../../hooks/useLiveLocation'
import { fetchRoute, distanceM, fmtDist, fmtMin, type RouteInfo } from '../../lib/route'
import { wasteLabel, wastePoints } from '../../lib/waste'
import NavMap from '../../components/NavMap'
import TurnIcon from '../../components/TurnIcon'

const ctrl =
  'flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#101318]/95 text-white shadow-xl backdrop-blur'

function ActiveTask() {
  const navigate = useNavigate()
  const { task, loading } = useActiveTask()
  const { pos, error: locError } = useLiveLocation()
  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [follow, setFollow] = useState(true)
  const [fit, setFit] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [canForce, setCanForce] = useState(false)
  const last = useRef<{ lat: number; lng: number; t: number } | null>(null)
  const arrived = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const distM = pos && task ? distanceM(pos, { lat: task.latitude, lng: task.longitude }) : null
  const onSite = !!task && distM != null && distM <= task.onSiteMeters

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])

  // recalculate the route when you move 40 m+ (max every 8 s), or every minute
  useEffect(() => {
    if (!pos || !task) return
    const l = last.current
    const age = l ? Date.now() - l.t : Infinity
    const moved = l ? distanceM(l, pos) : Infinity
    if (age < 8000 || (moved < 40 && age < 60000)) return
    last.current = { lat: pos.lat, lng: pos.lng, t: Date.now() }
    fetchRoute(pos, { lat: task.latitude, lng: task.longitude }).then((r) => {
      if (!r) return
      setRoute(r)
      setTotal((t) => t ?? r.distance)
    })
  }, [pos, task])

  // keep the screen on while navigating
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const get = () =>
      navigator.wakeLock
        ?.request('screen')
        .then((l) => {
          lock = l
        })
        .catch(() => {})
    get()
    const onVis = () => {
      if (document.visibilityState === 'visible') get()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock?.release().catch(() => {})
    }
  }, [])

  // buzz once when you reach the spot
  useEffect(() => {
    if (onSite && !arrived.current) {
      arrived.current = true
      navigator.vibrate?.([200, 100, 200])
    }
  }, [onSite])

  if (loading) return <p className="p-8 text-sm text-muted">Loading...</p>
  if (!task) return <Navigate to="/cleaner/urgent" replace />

  const dest = { lat: task.latitude, lng: task.longitude }
  const remaining = route ? route.distance : (distM ?? 0)
  const pct = total ? Math.min(100, Math.max(0, (1 - remaining / total) * 100)) : 0

  // OSRM: a step's text is what to do at its START, so the next manoeuvre is step[1]
  const next = route ? (route.steps[1] ?? route.steps[0]) : null
  const after = route?.steps[2] ?? null
  const toNext = route ? (route.steps[1] ? route.steps[0].distance : route.distance) : 0
  const arrival = route
    ? new Date(now + route.duration * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null
  const before = task.images.find((i) => i.type !== 'AFTER')

  const acc = pos?.accuracy ?? 999
  const accDot = acc <= 30 ? 'bg-emerald-400' : acc <= 100 ? 'bg-amber-400' : 'bg-red-400'
  const kmh = pos?.speed != null && pos.speed > 0.5 ? Math.round(pos.speed * 3.6) : null

  let cta = { label: '', cls: '', disabled: true }
  if (!pos) cta = { label: 'Waiting for GPS...', cls: 'bg-white/10 text-white/60', disabled: true }
  else if (!onSite) cta = { label: `${fmtDist(distM ?? 0)} to the spot`, cls: 'bg-white/10 text-white/70', disabled: true }
  else if (uploading) cta = { label: 'Uploading photo...', cls: 'bg-white/10 text-white/60', disabled: true }
  else if (!file) cta = { label: 'Take after photo', cls: 'bg-emerald-500 text-white', disabled: false }
  else cta = { label: busy ? 'Submitting...' : 'Complete task', cls: 'bg-emerald-500 text-white', disabled: busy || !uploadedUrl }

    const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setUploadedUrl(null)
    setCanForce(false)
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', await compressImage(f))
      const up = await api.post('/storage/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadedUrl(up.data.url)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed. Retake the photo.')
      setFile(null)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

    const complete = async (force = false) => {
    if (!uploadedUrl || !pos) return
    setBusy(true)
    setError('')
    try {
      await api.post(`/reports/${task.id}/complete`, {
        afterImageUrl: uploadedUrl,
        latitude: pos.lat,
        longitude: pos.lng,
        force,
      })
      navigate('/cleaner/urgent', { replace: true })
    } catch (e: any) {
      const d = e?.response?.data
      setError(d?.message || 'Could not complete. Try again.')
      if (d?.code === 'NOT_CLEANED') {
        setCanForce(true)
      } else if (/too old|fresh photo/i.test(d?.message || '')) {
        setFile(null)
        setPreview(null)
        setUploadedUrl(null)
        setCanForce(false)
      }
    } finally {
      setBusy(false)
    }
  }

  const onCta = () => (file ? complete() : fileRef.current?.click())

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
          heading={pos?.heading ?? null}
          accuracy={pos?.accuracy ?? null}
          route={route?.coords ?? []}
          follow={follow}
          fitSignal={fit}
          onDrag={() => setFollow(false)}
        />
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />

      {/* top: turn-by-turn */}
      <div className="fixed left-3 right-3 top-3 z-20 mx-auto max-w-xl">
        <div
          className={`rounded-3xl border border-white/10 p-4 text-white shadow-2xl backdrop-blur-xl ${
            onSite ? 'bg-emerald-600/95' : 'bg-[#101318]/95'
          }`}
        >
          {locError ? (
            <p className="text-sm">{locError}</p>
          ) : !pos ? (
            <p className="text-sm">Getting your GPS...</p>
          ) : onSite ? (
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <TurnIcon type="arrive" size={30} />
              </span>
              <div>
                <p className="text-xl font-black leading-tight">You've arrived</p>
                <p className="text-xs text-white/80">Take the after photo to finish the job</p>
              </div>
            </div>
          ) : !next ? (
            <div>
              <p className="text-lg font-black">Head to the pin · {fmtDist(distM ?? 0)}</p>
              <p className="text-xs text-white/60">Finding turn-by-turn directions...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white">
                  <TurnIcon type={next.type} modifier={next.modifier} size={30} />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-black leading-none tracking-tight">{fmtDist(toNext)}</p>
                  <p className="mt-1 truncate text-sm text-white/80">{next.text}</p>
                </div>
              </div>
              {after && (
                <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2 text-xs text-white/60">
                  <span>Then</span>
                  <TurnIcon type={after.type} modifier={after.modifier} size={14} />
                  <span className="truncate">{after.text}</span>
                </div>
              )}
            </>
          )}
        </div>

        {pos && (
          <div className="mt-2 flex gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[#101318]/90 px-3 py-1 text-[11px] text-white/80">
              <span className={`h-2 w-2 rounded-full ${accDot}`} />
              LIVE · GPS ±{Math.round(acc)} m
            </span>
            {kmh != null && (
              <span className="rounded-full bg-[#101318]/90 px-3 py-1 text-[11px] text-white/80">{kmh} km/h</span>
            )}
          </div>
        )}
      </div>

      {/* bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-xl">
        <div className="relative">
          <div className="absolute -top-14 right-3 flex gap-2">
            <button onClick={() => setFollow(true)} aria-label="Recenter" className={`${ctrl} ${follow ? 'text-blue-400' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            </button>
            <button
              onClick={() => {
                setFollow(false)
                setFit((n) => n + 1)
              }}
              aria-label="Overview"
              className={ctrl}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            </button>
          </div>

          <div className="rounded-t-3xl border border-white/10 bg-[#101318]/95 text-white shadow-2xl backdrop-blur-xl">
            <button onClick={() => setExpanded((v) => !v)} className="flex w-full justify-center pb-1 pt-2.5" aria-label="Toggle details">
              <span className="h-1.5 w-10 rounded-full bg-white/25" />
            </button>

            <div className="max-h-[68vh] overflow-y-auto px-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-black leading-none tracking-tight">{route ? fmtMin(route.duration) : '--'}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {route
                      ? `${fmtDist(remaining)}${arrival ? ` · arrive ${arrival}` : ''}`
                      : distM != null
                        ? `${fmtDist(distM)} away`
                        : 'Finding route...'}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-black text-emerald-300">
                  +{wastePoints(task.wasteType)} pts
                </span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>

              <button
                onClick={onCta}
                disabled={cta.disabled}
                className={`mt-4 w-full rounded-2xl py-3.5 text-sm font-bold transition-colors ${cta.cls}`}
              >
                {cta.label}
              </button>

              {preview && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={preview} alt="After" className="h-12 w-12 rounded-lg object-cover" />
                  <p className="flex-1 text-xs text-white/70">After photo ready</p>
                  <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-400 underline">
                    Retake
                  </button>
                </div>
              )}
              {error && <p className="mt-2 text-xs text-red-300">{error}</p>}{canForce && (
                <button
                  onClick={() => complete(true)}
                  disabled={busy}
                  className="mt-2 w-full rounded-2xl border border-amber-400/40 py-3 text-sm font-medium text-amber-300 disabled:opacity-50"
                >
                  Submit anyway (admin will review)
                </button>
              )}

              <button
                onClick={release}
                className="mt-3 w-full rounded-2xl border border-red-400/30 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
              >
                Cancel task
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex gap-3 border-t border-white/10 pt-4">
                      {before && <img src={before.url} alt="Before" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{wasteLabel(task.wasteType)}</p>
                        <p className="text-xs text-white/60">{task.description.split(':')[0]}</p>
                        <p className="mt-1 text-[11px] text-white/40">Reported by {task.reporter?.name ?? 'a citizen'}</p>
                      </div>
                    </div>

                    {route && route.steps.length > 1 && (
                      <ol className="mt-4 space-y-2">
                        {route.steps.slice(1).map((s, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-xs">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                              <TurnIcon type={s.type} modifier={s.modifier} size={14} />
                            </span>
                            <span className="flex-1 text-white/80">{s.text}</span>
                            <span className="text-white/40">{fmtDist(route.steps[i].distance)}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ActiveTask