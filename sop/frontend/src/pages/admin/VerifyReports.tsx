import { useState } from 'react'
import { useReports } from '../../hooks/useReports'
import { wasteLabel, wastePoints } from '../../lib/waste'
import LocationBlock from '../../components/LocationBlock'

function VerifyReports() {
  const { reports, loading, updateStatus } = useReports('all', 10000)
  const [busyId, setBusyId] = useState<string | null>(null)

  const queue = reports.filter((r) => r.status === 'CLEANING_COMPLETED')

  const act = async (id: string, status: 'RESOLVED' | 'REJECTED', note: string) => {
    setBusyId(id)
    try {
      await updateStatus(id, status, note)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Verification</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Verify Reports</h1>
        <p className="text-muted text-sm mt-1">Approving here pays points to the citizen and the cleaner</p>
      </div>

      {queue.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">Nothing waiting on verification right now.</p>
      ) : (
        <div className="space-y-4">
          {queue.map((r) => {
            const before = r.images.find((i) => i.type !== 'AFTER')
            const after = r.images.find((i) => i.type === 'AFTER')
            const cleaner = r.assignment?.cleaner?.name || r.assignment?.cleaningTeam?.name
            return (
              <div key={r.id} className="bg-surface border border-line rounded-xl p-5">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                    <p className="text-sm font-bold">{wasteLabel(r.wasteType)}</p>
                    <p className="text-sm text-muted">{r.description.split(':')[0]}</p>
                    <p className="text-xs text-muted mt-0.5">
                      Reporter: {r.reporter?.name || r.reporter?.email || '-'} · Cleaner: {cleaner || '-'}
                    </p>
                    <LocationBlock lat={r.latitude} lng={r.longitude} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(r.id, 'RESOLVED', 'Verified and resolved by admin')}
                      disabled={busyId === r.id}
                      className="bg-ink text-paper px-4 py-1.5 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                    >
                      Approve · +{wastePoints(r.wasteType)} each
                    </button>
                    <button
                      onClick={() => act(r.id, 'REJECTED', 'Rejected by admin')}
                      disabled={busyId === r.id}
                      className="border border-line px-4 py-1.5 rounded-md text-xs font-medium hover:border-glass transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="label text-muted mb-1">Before</p>
                    {before ? (
                      <img src={before.url} alt="Before" className="w-full h-48 object-cover rounded-lg border border-line" />
                    ) : (
                      <div className="h-48 rounded-lg border border-line flex items-center justify-center text-xs text-muted">No photo</div>
                    )}
                  </div>
                  <div>
                    <p className="label text-muted mb-1">After</p>
                    {after ? (
                      <img src={after.url} alt="After" className="w-full h-48 object-cover rounded-lg border border-line" />
                    ) : (
                      <div className="h-48 rounded-lg border border-line flex items-center justify-center text-xs text-muted">No photo</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default VerifyReports