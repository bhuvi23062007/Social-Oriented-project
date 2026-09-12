import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCredits } from '../../hooks/useCredits'
import { useReports } from '../../hooks/useReports'
import { useMessages } from '../../hooks/useMessages'

const CLEANER_NAME = 'Karthik Raj'
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }
const performance = { rating: 4.8, avgTime: '38 min', onTimeRate: '96%', totalLifetime: 62 }

function CleanerHome() {
  const { balance } = useCredits('cleaner')
  const { reports } = useReports()
  const { messages } = useMessages()

  const openQueue = reports.filter((r) => r.status === 'pending')
  const myAwaiting = reports.filter((r) => r.status === 'awaiting_verification' && r.cleanerName === CLEANER_NAME)
  const myMessages = messages.filter((m) => m.cleanerName === CLEANER_NAME)
  const urgentUnread = myMessages.filter((m) => m.priority === 'urgent' && m.status === 'unread')

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Cleaner Dashboard</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Good morning, {CLEANER_NAME.split(' ')[0]}</h1>
        <p className="text-muted text-sm mt-1">Here's your work overview for today</p>
      </div>

      {urgentUnread.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-glass/10 border border-glass rounded-xl p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-md bg-glass text-white flex items-center justify-center text-sm flex-shrink-0">!</span>
              <div>
                <p className="text-sm font-bold">{urgentUnread.length} urgent request{urgentUnread.length > 1 ? 's' : ''} from Admin</p>
                <p className="text-sm text-muted mt-0.5">{urgentUnread[0].body}</p>
              </div>
            </div>
            <Link to="/cleaner/urgent" className="bg-ink text-paper px-4 py-1.5 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors flex-shrink-0">
              View Urgent Requests
            </Link>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Tasks', value: String(openQueue.length), to: '/cleaner/tasks' },
          { label: 'Awaiting Verification', value: String(myAwaiting.length), to: '/cleaner/tasks' },
          { label: 'Completed (Total)', value: String(performance.totalLifetime), accent: true, to: '/cleaner/tasks' },
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

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.15 }} className="bg-surface border border-line rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Today's Open Tasks</h3>
            <Link to="/cleaner/tasks" className="text-xs text-accent font-medium hover:underline">View all →</Link>
          </div>
          {openQueue.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">No open tasks right now.</p>
          ) : (
            <div className="space-y-2.5">
              {openQueue.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-paper-stream" />
                    <div>
                      <p className="text-xs font-mono text-muted">{r.id}</p>
                      <p className="text-sm font-medium">{r.location}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted">{r.submittedAt}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.2 }} className="bg-surface border border-line rounded-xl p-6 h-fit">
          <h3 className="text-base font-bold mb-4">Your Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Rating</span><span className="text-sm font-bold">⭐ {performance.rating}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">Avg. completion time</span><span className="text-sm font-bold">{performance.avgTime}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">On-time rate</span><span className="text-sm font-bold text-organic">{performance.onTimeRate}</span></div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CleanerHome