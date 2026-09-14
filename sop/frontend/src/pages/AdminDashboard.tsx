import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCredits } from '../hooks/useCredits'
import { useReports } from '../hooks/useReports'
import { useMessages } from '../hooks/useMessages'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
}

const cleanerRoster = [
  { name: 'Karthik Raj', status: 'active', rating: 4.8, tasksToday: 3 },
  { name: 'Arjun Dev', status: 'active', rating: 4.6, tasksToday: 2 },
  { name: 'Meena Iyer', status: 'offline', rating: 4.9, tasksToday: 0 },
]

const streamBreakdown = [
  { name: 'Organic', color: 'bg-organic', pct: 38 },
  { name: 'Plastic', color: 'bg-plastic', pct: 29 },
  { name: 'Paper', color: 'bg-paper-stream', pct: 19 },
  { name: 'Glass', color: 'bg-glass', pct: 14 },
]

const cleanerNames = cleanerRoster.map((c) => c.name)

function AdminDashboard() {
  const userCredits = useCredits('user')
  const cleanerCredits = useCredits('cleaner')
  const { reports, approve, reject } = useReports()
  const { messages, sendMessage } = useMessages()

  const [tab, setTab] = useState<'verify' | 'reports' | 'cleaners' | 'messages'>('verify')
  const [msgCleaner, setMsgCleaner] = useState(cleanerNames[0])
  const [msgLocation, setMsgLocation] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgPriority, setMsgPriority] = useState<'normal' | 'urgent'>('urgent')

  const verificationQueue = reports.filter((r) => r.status === 'awaiting_verification' || r.status === 'pending')
  const activeTasks = reports.filter((r) => r.status === 'awaiting_verification')
  const completedTasks = reports.filter((r) => r.status === 'verified')
  const rejectedTasks = reports.filter((r) => r.status === 'rejected')

  const handleApprove = (report: (typeof reports)[number]) => {
    approve(report.id)
    userCredits.award(20, `Waste report verified — ${report.id}`)
    if (report.cleanerName) cleanerCredits.award(30, `Cleanup task verified — ${report.id}`)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgLocation || !msgBody) return
    sendMessage(msgCleaner, msgLocation, msgBody, msgPriority)
    setMsgLocation('')
    setMsgBody('')
  }

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Admin</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Platform Overview</h1>
        <p className="text-muted text-sm mt-1">Citywide activity across all users and cleaners</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Reports', value: String(reports.length) },
          { label: 'Active Tasks', value: String(activeTasks.length), accent: true },
          { label: 'Completed', value: String(completedTasks.length) },
          { label: 'Active Cleaners', value: String(cleanerRoster.filter((c) => c.status === 'active').length) },
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

      {/* Stream breakdown strip */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.1 }} className="bg-surface border border-line rounded-xl p-6 mb-6">
        <h3 className="text-base font-bold mb-4">Stream Breakdown</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          {streamBreakdown.map((s) => (
            <div key={s.name}>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>{s.name}</span>
                <span>{s.pct}%</span>
              </div>
              <div className="h-1.5 bg-paper border border-line rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${s.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          { key: 'verify', label: `Verify (${verificationQueue.length})` },
          { key: 'reports', label: `All Reports (${reports.length})` },
          { key: 'cleaners', label: 'Cleaners' },
          { key: 'messages', label: `Messages (${messages.length})` },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-ink text-paper' : 'border border-line text-muted hover:border-accent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'verify' && (
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-surface border border-line rounded-xl p-6">
          <p className="text-xs text-muted mb-4">Approving here is the only way credits are issued.</p>
          {verificationQueue.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Nothing waiting on verification right now.</p>
          ) : (
            <div className="space-y-2.5">
              {verificationQueue.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3 flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-mono text-muted">{r.id}</p>
                    <p className="text-sm font-medium">
                      {r.submittedBy} · {r.location}
                      {r.cleanerName && <span className="text-muted"> · collected by {r.cleanerName}</span>}
                    </p>
                    <span className="label text-muted mt-0.5 inline-block">
                      {r.status === 'pending' ? 'Not yet picked up' : 'Pickup reported — awaiting review'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(r)} className="bg-ink text-paper px-4 py-1.5 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors">
                      Approve{r.cleanerName ? ' · +20/+30' : ' · +20'}
                    </button>
                    <button onClick={() => reject(r.id)} className="border border-line px-4 py-1.5 rounded-md text-xs font-medium hover:border-glass transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {tab === 'reports' && (
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-4 py-3 label text-muted">ID</th>
                  <th className="px-4 py-3 label text-muted">Reporter</th>
                  <th className="px-4 py-3 label text-muted">Location</th>
                  <th className="px-4 py-3 label text-muted">Stream</th>
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
          {rejectedTasks.length > 0 && (
            <div className="px-4 py-3 border-t border-line text-xs text-muted">
              {rejectedTasks.length} report{rejectedTasks.length > 1 ? 's' : ''} rejected
            </div>
          )}
        </motion.div>
      )}

      {tab === 'cleaners' && (
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="grid md:grid-cols-3 gap-4">
          {cleanerRoster.map((c) => (
            <div key={c.name} className="bg-surface border border-line rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm">{c.name}</span>
                <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-organic' : 'bg-muted'}`} />
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Rating</span><span className="text-ink font-medium">⭐ {c.rating}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Tasks today</span><span className="text-ink font-medium">{c.tasksToday}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Status</span><span className="text-ink font-medium capitalize">{c.status}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {tab === 'messages' && (
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="grid lg:grid-cols-[1fr_1.3fr] gap-4">
          <div className="bg-surface border border-line rounded-xl p-6">
            <h3 className="text-base font-bold mb-4">Send Task to Cleaner</h3>
            <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
              <div>
                <label className="label text-muted block mb-1.5">Cleaner</label>
                <select value={msgCleaner} onChange={(e) => setMsgCleaner(e.target.value)} className="w-full border border-line rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent">
                  {cleanerNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-muted block mb-1.5">Location</label>
                <input type="text" value={msgLocation} onChange={(e) => setMsgLocation(e.target.value)} placeholder="e.g. Nungambakkam High Rd" className="w-full border border-line rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="label text-muted block mb-1.5">Message</label>
                <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={3} placeholder="Urgent cleaning required in this area..." className="w-full border border-line rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
              </div>
              <div className="flex gap-2">
                {(['urgent', 'normal'] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setMsgPriority(p)} className={`flex-1 py-2 rounded-md text-xs font-medium border capitalize transition-colors ${msgPriority === p ? 'bg-ink text-paper border-ink' : 'border-line text-muted hover:border-accent'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <button type="submit" className="bg-accent text-white py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity mt-1">
                Send to {msgCleaner.split(' ')[0]}
              </button>
            </form>
          </div>

          <div className="bg-surface border border-line rounded-xl p-6">
            <h3 className="text-base font-bold mb-4">Sent Messages</h3>
            {messages.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">No messages sent yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3 gap-3">
                    <div>
                      <p className="text-sm font-medium">{m.cleanerName} · {m.location}</p>
                      <p className="text-xs text-muted mt-0.5">{m.body}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`label px-2 py-0.5 rounded-full ${m.priority === 'urgent' ? 'bg-glass text-white' : 'bg-accent-soft text-muted'}`}>
                        {m.priority}
                      </span>
                      <p className="text-xs text-muted mt-1 capitalize">{m.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default AdminDashboard