import { motion } from 'framer-motion'
import type { CreditEvent } from '../hooks/useCredits'

function iconFor(reason: string) {
  if (reason.toLowerCase().includes('report')) return '📍'
  if (reason.toLowerCase().includes('task') || reason.toLowerCase().includes('cleanup')) return '✓'
  if (reason.toLowerCase().includes('redeem')) return '🎁'
  if (reason.toLowerCase().includes('bonus') || reason.toLowerCase().includes('streak')) return '⚡'
  return '●'
}

export default function CreditsCard({ balance, history, label = 'Available Credits' }: { balance: number; history: CreditEvent[]; label?: string }) {
  return (
    <div className="grid md:grid-cols-[1fr_1.3fr] gap-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="bg-accent text-white rounded-xl p-6 flex flex-col justify-between"
      >
        <div>
          <p className="text-xs opacity-80 mb-1">{label}</p>
          <motion.h2
            key={balance}
            initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="text-4xl font-black tracking-tight"
          >
            {balance.toLocaleString()}
          </motion.h2>
          <p className="text-xs opacity-70 mt-1">points</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs opacity-75 mt-6 pt-4 border-t border-white/20">
          <span>●</span>
          <span>Updates automatically when activity is verified</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-surface border border-line rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Credit History</h3>
          <span className="label text-muted">{history.length} entries</span>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">No credit activity yet.</p>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {history.map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-paper border border-line rounded-lg px-3.5 py-2.5"
              >
                <span className="w-7 h-7 rounded-md bg-accent-soft text-accent flex items-center justify-center text-xs flex-shrink-0">
                  {iconFor(h.reason)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{h.reason}</p>
                  <p className="text-xs text-muted mt-0.5">{h.date}</p>
                </div>
                <span className={`font-mono text-sm font-bold flex-shrink-0 ${h.points > 0 ? 'text-organic' : 'text-glass'}`}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}