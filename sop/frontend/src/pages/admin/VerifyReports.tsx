import { useReports } from '../../hooks/useReports'

function VerifyReports() {
  const { reports, loading, updateStatus } = useReports('all')

  const queue = reports.filter((r) => r.status === 'CLEANING_COMPLETED' || r.status === 'PENDING')

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Verification</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Verify Reports</h1>
        <p className="text-muted text-sm mt-1">Resolving here is the only way credits are issued to citizens</p>
      </div>

      {queue.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">Nothing waiting on verification right now.</p>
      ) : (
        <div className="space-y-2.5">
          {queue.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3.5 flex-wrap gap-2">
              <div>
                <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                <p className="text-sm font-medium">{r.description.split(':')[0]}</p>
                <span className="label text-muted mt-0.5 inline-block">
                  {r.status === 'PENDING' ? 'Not yet picked up' : 'Cleaning completed — awaiting review'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(r.id, 'RESOLVED', 'Verified and resolved by admin')}
                  className="bg-ink text-paper px-4 py-1.5 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors"
                >
                  Approve · +10
                </button>
                <button
                  onClick={() => updateStatus(r.id, 'REJECTED', 'Rejected by admin')}
                  className="border border-line px-4 py-1.5 rounded-md text-xs font-medium hover:border-glass transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VerifyReports