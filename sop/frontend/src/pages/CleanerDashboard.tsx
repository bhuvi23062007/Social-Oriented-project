import { useState } from 'react'
import { motion } from 'framer-motion'
import CreditsCard from '../components/CreditsCard'
import { useCredits } from '../hooks/useCredits'
import { useReports } from '../hooks/useReports'
import { useMessages } from '../hooks/useMessages'

const CLEANER_NAME = 'Karthik Raj'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const performance = { rating: 4.8, avgTime: '38 min', onTimeRate: '96%', totalLifetime: 62 }

function CleanerDashboard() {
  const { balance, history } = useCredits('cleaner')
  const { reports, markCollected } = useReports()
  const { messages, updateStatus } = useMessages()
  const [tab, setTab] = useState<'open' | 'mine' | 'history'>('open')

  const openQueue = reports.filter((r) => r.status === 'pending')
  const myAwaiting = reports.filter((r) => r.status === 'awaiting_verification' && r.cleanerName === CLEANER_NAME)
  const myVerified = reports.filter((r) => r.status === 'verified' && r.cleanerName === CLEANER_NAME)

  const myMessages = messages.filter((m) => m.cleanerName === CLEANER_NAME)
  const urgentUnread = myMessages.filter((m) => m.priority === 'urgent' && m.status === 'unread')

  const totalAssigned = openQueue.length + myAwaiting.length

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Cleaner Dashboard</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Good morning, {CLEANER_NAME.split(' ')[0]}</h1>
        <p className="text-muted text-sm mt-1">Here's your task overview for today</p>
      </div>

      {/* Urgent alerts */}
      {urgentUnread.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-glass/10 border border-glass rounded-xl p-4"
        >
          {urgentUnread.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-md bg-glass text-white flex items-center justify-center text-sm flex-shrink-0">!</span>
                <div>
                  <p className="text-sm font-bold">Urgent request from Admin · {m.location}</p>
                  <p className="text-sm text-muted mt-0.5">{m.body}</p>
                  <p className="text-xs text-muted mt-1">{m.sentAt}</p>
                </div>
              </div>
              <button
                onClick={() => updateStatus(m.id, 'accepted')}
                className="bg-ink text-paper px-4 py-1.5 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors flex-shrink-0"
              >
                Accept & Start
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Assigned Tasks', value: String(totalAssigned) },
          { label: 'Awaiting Verification', value: String(myAwaiting.length) },
          { label: 'Completed (Total)', value: String(performance.totalLifetime), accent: true },
          { label: 'Urgent Requests', value: String(urgentUnread.length) },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial="hidden" animate="show" variants={fadeUp} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, borderColor: 'var(--color-accent)' }}
            className="bg-surface border border-line rounded-xl p-5 transition-colors cursor-default"
          >
            <div className={`text-2xl font-black tracking-tight ${s.accent ? 'text-accent' : ''}`}>{s.value}</div>
            <div className="label text-muted mt-1.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 mb-6">
        {/* Task tabs */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.15 }}>
          <div className="flex gap-2 mb-4">
            {(['open', 'mine', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  tab === t ? 'bg-ink text-paper' : 'border border-line text-muted hover:border-accent'
                }`}
              >
                {t === 'open' && `Open Queue (${openQueue.length})`}
                {t === 'mine' && `Awaiting Verification (${myAwaiting.length})`}
                {t === 'history' && `Completed (${myVerified.length})`}
              </button>
            ))}
          </div>

          {tab === 'open' && (
            openQueue.length === 0 ? (
              <p className="text-sm text-muted py-10 text-center border border-line rounded-xl">No open reports right now — check back soon.</p>
            ) : (
              <div className="space-y-2.5">
                {openQueue.map((r) => (
                  <motion.div
                    key={r.id}
                    whileHover={{ borderColor: 'var(--color-accent)' }}
                    className="bg-surface border border-line rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-md bg-accent-soft flex items-center justify-center text-lg flex-shrink-0">📍</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-mono text-muted">{r.id}</p>
                            <span className="label px-2 py-0.5 rounded-full text-white bg-paper-stream">{r.stream}</span>
                          </div>
                          <p className="text-sm font-medium mt-0.5">{r.location}</p>
                          <p className="text-xs text-muted mt-0.5">Reported by {r.submittedBy} · {r.submittedAt}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => markCollected(r.id, CLEANER_NAME)}
                        className="bg-ink text-paper px-3.5 py-2 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors flex-shrink-0"
                      >
                        Accept Task
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {tab === 'mine' && (
            myAwaiting.length === 0 ? (
              <p className="text-sm text-muted py-10 text-center border border-line rounded-xl">No tasks awaiting verification.</p>
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
                <p className="text-xs text-muted italic">Credits are added once admin verifies these pickups.</p>
              </div>
            )
          )}

          {tab === 'history' && (
            myVerified.length === 0 ? (
              <p className="text-sm text-muted py-10 text-center border border-line rounded-xl">No verified pickups yet.</p>
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
        </motion.div>

        {/* Performance sidebar */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.2 }} className="bg-surface border border-line rounded-xl p-6 h-fit">
          <h3 className="text-base font-bold mb-4">Your Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Rating</span>
              <span className="text-sm font-bold">⭐ {performance.rating}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Avg. completion time</span>
              <span className="text-sm font-bold">{performance.avgTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">On-time rate</span>
              <span className="text-sm font-bold text-organic">{performance.onTimeRate}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-line">
              <span className="text-sm text-muted">Lifetime tasks</span>
              <span className="text-sm font-bold">{performance.totalLifetime}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Message log */}
      {myMessages.length > 0 && (
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.25 }} className="mb-6">
          <h3 className="text-base font-bold mb-4">Messages from Admin</h3>
          <div className="space-y-2.5">
            {myMessages.map((m) => (
              <div key={m.id} className="bg-surface border border-line rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{m.location}</span>
                  <span className={`label px-2 py-0.5 rounded-full ${m.priority === 'urgent' ? 'bg-glass text-white' : 'bg-accent-soft text-muted'}`}>
                    {m.priority}
                  </span>
                </div>
                <p className="text-sm text-muted">{m.body}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">{m.sentAt}</span>
                  <span className="text-xs font-medium capitalize">{m.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Credits */}
      <div>
        <h3 className="text-base font-bold mb-4">Your Credits</h3>
        <CreditsCard balance={balance} history={history} label="Total Credits Earned" />
      </div>
    </div>
  )
}

export default CleanerDashboard