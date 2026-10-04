import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCredits } from '../hooks/useCredits'
import { useReports } from '../hooks/useReports'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../AuthContext'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-paper-stream',
  ACCEPTED: 'bg-plastic',
  IN_PROGRESS: 'bg-plastic',
  CLEANING_COMPLETED: 'bg-plastic',
  RESOLVED: 'bg-organic',
  REJECTED: 'bg-glass',
}
const statusLabel: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  CLEANING_COMPLETED: 'Awaiting verification',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
}

function Dashboard() {
  const { auth } = useAuth()
  const { balance, loading: creditsLoading } = useCredits()
  const { reports, loading: reportsLoading } = useReports('mine')
  const { unreadCount } = useNotifications()

  const firstName = auth?.name?.split(' ')[0] ?? 'there'
  const pendingCount = reports.filter((r) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'CLEANING_COMPLETED'].includes(r.status)).length
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length

  if (reportsLoading || creditsLoading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <span className="label text-accent">Dashboard</span>
          <h1 className="text-3xl font-black tracking-tighter mt-1">Welcome, {firstName}!</h1>
          <p className="text-muted text-sm mt-1">Here's what's happening with your reports</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link to="/report-waste" className="bg-ink text-paper px-5 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-white transition-colors inline-flex items-center gap-1.5">
            + Report Waste
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Reports', value: String(reports.length), to: '/my-reports' },
          { label: 'Resolved', value: String(resolvedCount), accent: true, to: '/my-reports' },
          { label: 'Pending', value: String(pendingCount), to: '/my-reports' },
          { label: 'Credits', value: String(balance), to: '/credits' },
        ].map((s, i) => (
          <Link key={s.label} to={s.to}>
            <motion.div
              initial="hidden" animate="show" variants={fadeUp} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, borderColor: '#3b82f6' }}
              className="bg-surface border border-line rounded-xl p-5 transition-colors cursor-pointer h-full"
            >
              <div className={`text-2xl font-black tracking-tight ${s.accent ? 'text-accent' : ''}`}>{s.value}</div>
              <div className="label text-muted mt-1.5">{s.label}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-[1.4fr_1fr] gap-4">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-surface border border-line rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Recent Reports</h3>
            <Link to="/my-reports" className="text-xs text-accent font-medium hover:underline">View all →</Link>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">No reports yet.</p>
          ) : (
            <div className="space-y-2.5">
              {reports.slice(0, 4).map((r) => (
                <motion.div key={r.id} whileHover={{ x: 4, borderColor: 'var(--color-accent)' }} className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor[r.status]}`} />
                    <div>
                      <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                      <p className="text-sm font-medium">{r.description.split(':')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted">{statusLabel[r.status]}</span>
                    <p className="text-xs text-muted mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-surface border border-line rounded-xl p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold mb-1">Notifications</h3>
            <p className="text-sm text-muted">{unreadCount} unread</p>
          </div>
          <Link to="/notifications" className="text-xs text-accent font-medium hover:underline">View all →</Link>
          <div className="pt-4 border-t border-line">
            <h3 className="text-base font-bold mb-2">Your Credits</h3>
            <p className="text-2xl font-black tracking-tight text-accent">{balance}</p>
            <p className="text-xs text-muted mt-2">Earned from resolved reports</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard