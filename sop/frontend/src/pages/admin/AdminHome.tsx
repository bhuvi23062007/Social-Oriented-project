import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useReports } from '../../hooks/useReports'
import { useMessages } from '../../hooks/useMessages'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } } }
const streamBreakdown = [
  { name: 'Organic', color: 'bg-organic', pct: 38 }, { name: 'Plastic', color: 'bg-plastic', pct: 29 },
  { name: 'Paper', color: 'bg-paper-stream', pct: 19 }, { name: 'Glass', color: 'bg-glass', pct: 14 },
]
const cleanerRoster = [
  { name: 'Karthik Raj', status: 'active' }, { name: 'Arjun Dev', status: 'active' }, { name: 'Meena Iyer', status: 'offline' },
]

function AdminHome() {
  const { reports } = useReports()
  const { messages } = useMessages()

  const verificationQueue = reports.filter((r) => r.status === 'awaiting_verification' || r.status === 'pending')
  const activeTasks = reports.filter((r) => r.status === 'awaiting_verification')
  const completedTasks = reports.filter((r) => r.status === 'verified')

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Admin</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Platform Overview</h1>
        <p className="text-muted text-sm mt-1">Citywide activity across all users and cleaners</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Reports', value: String(reports.length), to: '/admin/reports' },
          { label: 'Pending Verification', value: String(verificationQueue.length), accent: true, to: '/admin/verify' },
          { label: 'Active Tasks', value: String(activeTasks.length), to: '/admin/reports' },
          { label: 'Completed', value: String(completedTasks.length), to: '/admin/reports' },
        ].map((s, i) => (
          <Link key={s.label} to={s.to}>
            <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: i * 0.05 }} whileHover={{ y: -4, borderColor: 'var(--color-accent)' }} className="bg-surface border border-line rounded-xl p-5 transition-colors cursor-pointer h-full">
              <div className={`text-2xl font-black tracking-tight ${s.accent ? 'text-accent' : ''}`}>{s.value}</div>
              <div className="label text-muted mt-1.5">{s.label}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.1 }} className="bg-surface border border-line rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Pending Verification</h3>
            <Link to="/admin/verify" className="text-xs text-accent font-medium hover:underline">Review all →</Link>
          </div>
          {verificationQueue.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Nothing waiting right now.</p>
          ) : (
            <div className="space-y-2.5">
              {verificationQueue.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs font-mono text-muted">{r.id}</p>
                    <p className="text-sm font-medium">{r.submittedBy} · {r.location}</p>
                  </div>
                  <span className="label text-muted">{r.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.15 }} className="bg-surface border border-line rounded-xl p-6">
          <h3 className="text-base font-bold mb-4">Stream Breakdown</h3>
          <div className="space-y-3">
            {streamBreakdown.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs text-muted mb-1"><span>{s.name}</span><span>{s.pct}%</span></div>
                <div className="h-1.5 bg-paper border border-line rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${s.color}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.2 }} className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="bg-surface border border-line rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Cleaners</h3>
            <Link to="/admin/cleaners" className="text-xs text-accent font-medium hover:underline">Manage →</Link>
          </div>
          <div className="space-y-2">
            {cleanerRoster.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="text-sm">{c.name}</span>
                <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-organic' : 'bg-muted'}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Recent Messages</h3>
            <Link to="/admin/messages" className="text-xs text-accent font-medium hover:underline">Send new →</Link>
          </div>
          <p className="text-sm text-muted">{messages.length} messages sent to cleaners</p>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminHome