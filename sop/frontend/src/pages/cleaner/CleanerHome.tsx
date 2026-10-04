import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCredits } from '../../hooks/useCredits'
import { useReports } from '../../hooks/useReports'
import { useAuth } from '../../AuthContext'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

function CleanerHome() {
  const { auth } = useAuth()
  const { balance, loading: creditsLoading } = useCredits()
  const { reports, loading: reportsLoading } = useReports('team')

  const active = reports.filter((r) => ['ACCEPTED', 'IN_PROGRESS'].includes(r.status))
  const awaitingVerification = reports.filter((r) => r.status === 'CLEANING_COMPLETED')
  const completed = reports.filter((r) => r.status === 'RESOLVED')

  if (creditsLoading || reportsLoading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Cleaner Dashboard</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Welcome, {auth?.name?.split(' ')[0] ?? 'there'}</h1>
        <p className="text-muted text-sm mt-1">Here's your work overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Tasks', value: String(active.length), to: '/cleaner/tasks' },
          { label: 'Awaiting Verification', value: String(awaitingVerification.length), to: '/cleaner/tasks' },
          { label: 'Completed (Total)', value: String(completed.length), accent: true, to: '/cleaner/tasks' },
          { label: 'Credits Earned', value: String(balance), to: '/cleaner/credits' },
        ].map((s, i) => (
          <Link key={s.label} to={s.to}>
            <motion.div
              initial="hidden" animate="show" variants={fadeUp} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, borderColor: 'var(--color-accent)' }}
              className="bg-surface border border-line rounded-xl p-5 transition-colors cursor-pointer h-full"
            >
              <div className={`text-2xl font-black tracking-tight ${s.accent ? 'text-accent' : ''}`}>{s.value}</div>
              <div className="label text-muted mt-1.5">{s.label}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.15 }} className="bg-surface border border-line rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">Active Tasks</h3>
          <Link to="/cleaner/tasks" className="text-xs text-accent font-medium hover:underline">View all →</Link>
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center">No active tasks right now.</p>
        ) : (
          <div className="space-y-2.5">
            {active.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-paper-stream" />
                  <div>
                    <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                    <p className="text-sm font-medium">{r.description.split(':')[0]}</p>
                  </div>
                </div>
                <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default CleanerHome