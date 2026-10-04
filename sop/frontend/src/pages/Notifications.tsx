import { motion } from 'framer-motion'
import { useNotifications } from '../hooks/useNotifications'

function Notifications() {
  const { items, markRead, loading } = useNotifications()

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Notifications</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Notifications</h1>
        <p className="text-muted text-sm mt-1">Updates about your reports and account</p>
      </div>
      <div className="space-y-2.5">
        {items.length === 0 && (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No notifications yet.</p>
        )}
        {items.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => markRead(n.id)}
            className={`bg-surface border rounded-lg px-4 py-3.5 cursor-pointer transition-colors ${n.read ? 'border-line' : 'border-accent'}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{n.message}</p>
              {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0 ml-2" />}
            </div>
            <p className="text-xs text-muted mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Notifications