import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReports } from '../../hooks/useReports'
import { useCleanerLocation } from '../../hooks/useCleanerLocation'
import { wasteLabel, wastePoints } from '../../lib/waste'
import LocationBlock from '../../components/LocationBlock'

function UrgentRequests() {
  useCleanerLocation()
  const { reports, loading, accept, refetch } = useReports('open', 5000)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleAccept = async (id: string) => {
    setBusyId(id)
    setMsg(null)
    try {
      await accept(id)
      setMsg({ type: 'ok', text: 'Accepted! Find it in My Tasks.' })
    } catch (e: any) {
      const status = e?.response?.status
      setMsg({
        type: 'err',
        text:
          status === 409
            ? 'Someone else already took that one.'
            : e?.response?.data?.message || 'Could not accept. Try again.',
      })
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
        <p className="text-muted text-sm mt-1">Requests within 5 km of you. First to accept gets the job.</p>
      </div>

      {msg && <p className={`text-sm mb-4 ${msg.type === 'ok' ? 'text-organic' : 'text-glass'}`}>{msg.text}</p>}

      {reports.length === 0 ? (
        <div className="text-sm text-muted py-16 text-center border border-line rounded-xl">
          <p>No requests near you right now.</p>
          <p className="text-xs mt-1">Keep this page open and allow location access so nearby requests appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
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
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-mono text-muted">
                    #{r.id.slice(0, 8)}
                    {r.distanceKm != null && ` · ${r.distanceKm.toFixed(1)} km away`}
                  </p>
                  <span className="label px-2 py-0.5 rounded-full bg-accent-soft text-accent">+{wastePoints(r.wasteType)} pts</span>
                </div>
                <p className="text-sm font-bold">{wasteLabel(r.wasteType)}</p>
                <p className="text-sm text-muted mt-1">{r.description.split(':')[0]}</p>
                <p className="text-xs text-muted mt-0.5">{new Date(r.createdAt).toLocaleString()}</p>

                <LocationBlock lat={r.latitude} lng={r.longitude} showMe />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAccept(r.id)}
                  disabled={busyId === r.id}
                  className="w-full mt-4 bg-ink text-paper py-2 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-60"
                >
                  {busyId === r.id ? '...' : 'Accept'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UrgentRequests