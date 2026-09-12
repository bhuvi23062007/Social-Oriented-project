import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReports } from '../../hooks/useReports'

const CLEANER_NAME = 'Karthik Raj'

function MyTasks() {
  const { reports, markCollected } = useReports()
  const [tab, setTab] = useState<'open' | 'mine' | 'history'>('open')

  const openQueue = reports.filter((r) => r.status === 'pending')
  const myAwaiting = reports.filter((r) => r.status === 'awaiting_verification' && r.cleanerName === CLEANER_NAME)
  const myVerified = reports.filter((r) => r.status === 'verified' && r.cleanerName === CLEANER_NAME)

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Tasks</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">My Tasks</h1>
        <p className="text-muted text-sm mt-1">Manage assigned, in-progress, and completed pickups</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['open', 'mine', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-ink text-paper' : 'border border-line text-muted hover:border-accent'}`}>
            {t === 'open' && `Open Queue (${openQueue.length})`}
            {t === 'mine' && `Awaiting Verification (${myAwaiting.length})`}
            {t === 'history' && `Completed (${myVerified.length})`}
          </button>
        ))}
      </div>

      {tab === 'open' && (
        openQueue.length === 0 ? (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No open tasks right now.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {openQueue.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ borderColor: 'var(--color-accent)' }} className="bg-surface border border-line rounded-xl p-5 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-md bg-accent-soft flex items-center justify-center text-lg flex-shrink-0">📍</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-muted">{r.id}</p>
                      <span className="label px-2 py-0.5 rounded-full text-white bg-paper-stream">{r.stream}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{r.location}</p>
                    <p className="text-xs text-muted mt-0.5">Reported by {r.submittedBy} · {r.submittedAt}</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => markCollected(r.id, CLEANER_NAME)} className="w-full mt-4 bg-ink text-paper py-2 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors">
                  Accept & Mark Collected
                </motion.button>
              </motion.div>
            ))}
          </div>
        )
      )}

      {tab === 'mine' && (
        myAwaiting.length === 0 ? (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No tasks awaiting verification.</p>
        ) : (
          <div className="space-y-2.5">
            {myAwaiting.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3">
                <div>
                  <p className="text-xs font-mono text-muted">{r.id}</p>
                  <p className="text-sm font-medium">{r.location}</p>
                  <p className="text-xs text-muted mt-0.5">{r.stream} · reported by {r.submittedBy}</p>
                </div>
                <span className="label px-2.5 py-1 rounded-full bg-accent-soft text-plastic">awaiting verification</span>
              </div>
            ))}
            <p className="text-xs text-muted italic pt-1">Credits are added once admin verifies these pickups.</p>
          </div>
        )
      )}

      {tab === 'history' && (
        myVerified.length === 0 ? (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No verified pickups yet.</p>
        ) : (
          <div className="space-y-2.5">
            {myVerified.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3">
                <div>
                  <p className="text-xs font-mono text-muted">{r.id}</p>
                  <p className="text-sm font-medium">{r.location}</p>
                  <p className="text-xs text-muted mt-0.5">{r.stream} · reported by {r.submittedBy}</p>
                </div>
                <span className="label px-2.5 py-1 rounded-full bg-accent-soft text-organic">verified · +30</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default MyTasks