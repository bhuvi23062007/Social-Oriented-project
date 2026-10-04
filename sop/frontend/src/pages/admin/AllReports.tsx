import { useReports } from '../../hooks/useReports'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-accent-soft text-paper-stream',
  ACCEPTED: 'bg-accent-soft text-accent',
  IN_PROGRESS: 'bg-accent-soft text-accent',
  CLEANING_COMPLETED: 'bg-accent-soft text-plastic',
  RESOLVED: 'bg-accent-soft text-organic',
  REJECTED: 'bg-accent-soft text-glass',
}

function AllReports() {
  const { reports, loading } = useReports('all')

  if (loading) return <p className="text-muted text-sm">Loading...</p>

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
                <th className="px-4 py-3 label text-muted">Description</th>
                <th className="px-4 py-3 label text-muted">Location</th>
                <th className="px-4 py-3 label text-muted">Status</th>
                <th className="px-4 py-3 label text-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted">#{r.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{r.description.split(':')[0]}</td>
                  <td className="px-4 py-3 text-muted">{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</td>
                  <td className="px-4 py-3">
                    <span className={`label px-2 py-0.5 rounded-full ${statusStyles[r.status]}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
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