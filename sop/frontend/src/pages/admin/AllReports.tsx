import { useReports } from '../../hooks/useReports'

function AllReports() {
  const { reports } = useReports()

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Reports</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">All Reports</h1>
        <p className="text-muted text-sm mt-1">Full history of every report submitted on the platform</p>
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-4 py-3 label text-muted">ID</th>
                <th className="px-4 py-3 label text-muted">Reporter</th>
                <th className="px-4 py-3 label text-muted">Location</th>
                <th className="px-4 py-3 label text-muted">Stream</th>
                <th className="px-4 py-3 label text-muted">Cleaner</th>
                <th className="px-4 py-3 label text-muted">Status</th>
                <th className="px-4 py-3 label text-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{r.id}</td>
                  <td className="px-4 py-3">{r.submittedBy}</td>
                  <td className="px-4 py-3 text-muted">{r.location}</td>
                  <td className="px-4 py-3 text-muted">{r.stream}</td>
                  <td className="px-4 py-3 text-muted">{r.cleanerName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`label px-2 py-0.5 rounded-full ${
                      r.status === 'verified' ? 'bg-accent-soft text-organic' :
                      r.status === 'rejected' ? 'bg-accent-soft text-glass' :
                      r.status === 'awaiting_verification' ? 'bg-accent-soft text-plastic' :
                      'bg-accent-soft text-paper-stream'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{r.submittedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AllReports