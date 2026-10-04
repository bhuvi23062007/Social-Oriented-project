import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReports } from '../../hooks/useReports'

function MyTasks() {
  const { reports, loading, updateStatus } = useReports('team')
  const [tab, setTab] = useState<'active' | 'completed'>('active')

  const active = reports.filter((r) => ['ACCEPTED', 'IN_PROGRESS'].includes(r.status))
  const awaitingVerification = reports.filter((r) => r.status === 'CLEANING_COMPLETED')
  const completed = reports.filter((r) => r.status === 'RESOLVED')

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Tasks</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">My Tasks</h1>
        <p className="text-muted text-sm mt-1">Manage tasks assigned to your team</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['active', 'completed'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-ink text-paper' : 'border border-line text-muted hover:border-accent'}`}>
            {t === 'active' && `Active (${active.length + awaitingVerification.length})`}
            {t === 'completed' && `Completed (${completed.length})`}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        active.length === 0 && awaitingVerification.length === 0 ? (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No active tasks right now.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {active.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ borderColor: 'var(--color-accent)' }} className="bg-surface border border-line rounded-xl p-5 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-md bg-accent-soft flex items-center justify-center text-lg flex-shrink-0">📍</span>
                  <div>
                    <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                    <p className="text-sm font-medium mt-1">{r.description.split(':')[0]}</p>
                    <p className="text-xs text-muted mt-0.5">{new Date(r.createdAt).toLocaleDateString()} · {r.status.replace('_', ' ')}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => updateStatus(r.id, r.status === 'ACCEPTED' ? 'IN_PROGRESS' : 'CLEANING_COMPLETED', 'Updated by cleaner')}
                  className="w-full mt-4 bg-ink text-paper py-2 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors"
                >
                  {r.status === 'ACCEPTED' ? 'Start Cleaning' : 'Mark Completed'}
                </motion.button>
              </motion.div>
            ))}
            {awaitingVerification.map((r) => (
              <div key={r.id} className="bg-surface border border-line rounded-xl p-5">
                <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                <p className="text-sm font-medium mt-1">{r.description.split(':')[0]}</p>
                <span className="label px-2.5 py-1 rounded-full bg-accent-soft text-plastic inline-block mt-3">awaiting admin verification</span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'completed' && (
        completed.length === 0 ? (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No completed pickups yet.</p>
        ) : (
          <div className="space-y-2.5">
            {completed.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3">
                <div>
                  <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                  <p className="text-sm font-medium">{r.description.split(':')[0]}</p>
                </div>
                <span className="label px-2.5 py-1 rounded-full bg-accent-soft text-organic">resolved</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default MyTasks