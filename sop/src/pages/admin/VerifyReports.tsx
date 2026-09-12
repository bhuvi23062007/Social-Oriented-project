import { useCredits } from '../../hooks/useCredits'
import { useReports } from '../../hooks/useReports'

function VerifyReports() {
  const userCredits = useCredits('user')
  const cleanerCredits = useCredits('cleaner')
  const { reports, approve, reject } = useReports()

  const queue = reports.filter((r) => r.status === 'awaiting_verification' || r.status === 'pending')

  const handleApprove = (report: (typeof reports)[number]) => {
    approve(report.id)
    userCredits.award(20, `Waste report verified — ${report.id}`)
    if (report.cleanerName) cleanerCredits.award(30, `Cleanup task verified — ${report.id}`)
  }

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Verification</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Verify Reports</h1>
        <p className="text-muted text-sm mt-1">Approving here is the only way credits are issued to users and cleaners</p>
      </div>

      {queue.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">Nothing waiting on verification right now.</p>
      ) : (
        <div className="space-y-2.5">
          {queue.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3.5 flex-wrap gap-2">
              <div>
                <p className="text-xs font-mono text-muted">{r.id}</p>
                <p className="text-sm font-medium">
                  {r.submittedBy} · {r.location}
                  {r.cleanerName && <span className="text-muted"> · collected by {r.cleanerName}</span>}
                </p>
                <span className="label text-muted mt-0.5 inline-block">
                  {r.status === 'pending' ? 'Not yet picked up' : 'Pickup reported — awaiting review'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(r)} className="bg-ink text-paper px-4 py-1.5 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors">
                  Approve{r.cleanerName ? ' · +20/+30' : ' · +20'}
                </button>
                <button onClick={() => reject(r.id)} className="border border-line px-4 py-1.5 rounded-md text-xs font-medium hover:border-glass transition-colors">
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