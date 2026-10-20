import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useReports } from '../../hooks/useReports'
import { useLiveLocation, type LocStatus } from '../../hooks/useLiveLocation'
import { wasteLabel, wastePoints } from '../../lib/waste'
import LocationBlock from '../../components/LocationBlock'

const LOC_MSG: Record<Exclude<LocStatus, 'ok'>, string> = {
  asking: 'Getting your location...',
  denied: 'Location is blocked. Allow it in your browser (lock icon next to the address bar). Requests appear automatically once it is on.',
  unavailable: "Can't get your location. Turn on GPS / location services on your device.",
}

function UrgentRequests() {
  const navigate = useNavigate()
  const { status, synced, retry } = useLiveLocation(15000)
  const { reports, loading, accept, refetch } = useReports('open', 5000)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  // as soon as the server has your location, load requests right away
  useEffect(() => {
    if (synced) refetch()
  }, [synced])

  const ready = status === 'ok' && synced > 0

  const handleAccept = async (id: string) => {
    setBusyId(id)
    setMsg(null)
    try {
      await accept(id)
      navigate('/cleaner/active')
    } catch (e: any) {
      setMsg(
        e?.response?.status === 409
          ? 'Someone else already took that one.'
          : e?.response?.data?.message || 'Could not accept. Try again.',
      )
      await refetch()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Live</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">New Requests</h1>
        <p className="text-muted text-sm mt-1">
          Within 5 km of you. Check the distance and credits, then accept. You stay on that task until it's done.
        </p>
      </div>

      {!ready && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-accent-soft px-4 py-3 text-sm">
          <span>{status === 'ok' ? 'Syncing your location...' : LOC_MSG[status]}</span>
          {status !== 'ok' && status !== 'asking' && (
            <button onClick={retry} className="shrink-0 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper">
              Try again
            </button>
          )}
        </div>
      )}

      {msg && <p className="text-sm mb-4 text-glass">{msg}</p>}

      {reports.length === 0 ? (
        ready && (
          <div className="text-sm text-muted py-16 text-center border border-line rounded-xl">
            <p>No requests near you right now.</p>
            <p className="text-xs mt-1">Keep this page open. New requests show up here by themselves.</p>
          </div>
        )
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reports.map((r, i) => {
            const km = r.distanceKm ?? 0
            const eta = Math.max(1, Math.round((km / 25) * 60))
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-surface border border-line rounded-xl overflow-hidden"
              >
                {r.images[0] ? (
                  <img src={r.images[0].url} alt="Waste" className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-accent-soft flex items-center justify-center text-4xl">🗑️</div>
                )}
                <div className="p-5">
                  <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                  <p className="text-sm font-bold mt-1">{wasteLabel(r.wasteType)}</p>
                  <p className="text-sm text-muted mt-1">{r.description.split(':')[0]}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="rounded-lg border border-line bg-paper p-3 text-center">
                      <p className="text-xl font-black">{km.toFixed(1)} km</p>
                      <p className="label text-muted">away · ≈{eta} min</p>
                    </div>
                    <div className="rounded-lg bg-accent-soft p-3 text-center">
                      <p className="text-xl font-black text-accent">+{wastePoints(r.wasteType)}</p>
                      <p className="label text-muted">credits on completion</p>
                    </div>
                  </div>

                  <LocationBlock lat={r.latitude} lng={r.longitude} showMe />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAccept(r.id)}
                    disabled={busyId === r.id}
                    className="w-full mt-4 bg-ink text-paper py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-60"
                  >
                    {busyId === r.id ? '...' : 'Accept & start navigation'}
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UrgentRequests