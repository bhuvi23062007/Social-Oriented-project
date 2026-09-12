import { motion } from 'framer-motion'
import { useNotifications } from '../../hooks/useNotifications'

function AdminNotifications() {
  const { items, markRead } = useNotifications('admin')
  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Notifications</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Notifications</h1>
        <p className="text-muted text-sm mt-1">System activity across the platform</p>
      </div>
      <div className="space-y-2.5">
        {items.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => markRead(n.id)}
            className={`bg-surface border rounded-lg px-4 py-3.5 cursor-pointer transition-colors ${n.read ? 'border-line' : 'border-accent'}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{n.title}</p>
              {!n.read && <span className="w-2 h-2 rounded-full bg-accent" />}
            </div>
            <p className="text-sm text-muted mt-0.5">{n.body}</p>
            <p className="text-xs text-muted mt-1.5">{n.time}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default AdminNotifications