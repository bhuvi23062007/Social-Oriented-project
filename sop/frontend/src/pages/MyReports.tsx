import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useReports } from '../hooks/useReports'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-accent-soft text-paper-stream',
  ACCEPTED: 'bg-accent-soft text-accent',
  IN_PROGRESS: 'bg-accent-soft text-accent',
  CLEANING_COMPLETED: 'bg-accent-soft text-accent',
  RESOLVED: 'bg-accent-soft text-organic',
  REJECTED: 'bg-accent-soft text-glass',
}

function MyReports() {
  const { reports, loading } = useReports('mine')

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  const total = reports.length
  const pending = reports.filter((r) => r.status === 'PENDING').length
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="label text-accent">Reports</span>
          <h1 className="text-3xl font-black tracking-tighter mt-1">My Reports</h1>
          <p className="text-muted text-sm mt-1">Track the waste reports you have submitted.</p>
        </div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link to="/report-waste" className="bg-ink text-paper px-5 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-white transition-colors">
            + New Report
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Reports', value: total, icon: '📋' },
          { label: 'Pending', value: pending, icon: '⏳' },
          { label: 'Resolved', value: resolved, icon: '✅' },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial="hidden" animate="show" variants={fadeUp}
            whileHover={{ y: -4, borderColor: '#3b82f6' }}
            className="bg-surface border border-line rounded-xl p-5 flex items-center gap-3 transition-colors cursor-pointer"
          >
            <span className="w-10 h-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center text-base">{s.icon}</span>
            <div>
              <div className="text-xl font-black tracking-tight">{s.value}</div>
              <div className="label text-muted mt-0.5">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        {reports.length === 0 && (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No reports yet.</p>
        )}
        {reports.map((r) => (
          <motion.div
            key={r.id}
            initial="hidden" animate="show" variants={fadeUp}
            whileHover={{ borderColor: '#3b82f6' }}
            className="bg-surface border border-line rounded-xl p-5 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2.5">
              <div>
                <h3 className="text-base font-bold">{r.description.split(':')[0]}</h3>
                <p className="text-xs text-muted mt-1">📍 {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</p>
              </div>
              <span className={`label px-2.5 py-1 rounded-full ${statusColors[r.status]}`}>
                {r.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-sm text-muted leading-relaxed mb-4">{r.description}</p>

            <div className="flex justify-between text-xs text-muted pt-3 border-t border-line">
              <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              <span>Report #{r.id.slice(0, 8)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default MyReports