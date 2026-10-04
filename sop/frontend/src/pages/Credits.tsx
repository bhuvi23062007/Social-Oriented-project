import { motion } from 'framer-motion'
import CreditsCard from '../components/CreditsCard'
import { useCredits } from '../hooks/useCredits'

function Credits() {
  const { balance, history, loading } = useCredits()

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Citizen</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Credits & Rewards</h1>
        <p className="text-muted text-sm mt-1">Track your earned credits from resolved reports</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-line rounded-xl p-5">
          <div className="text-2xl font-black tracking-tight text-accent">{balance}</div>
          <div className="label text-muted mt-1.5">Total Credits</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-surface border border-line rounded-xl p-5">
          <div className="text-2xl font-black tracking-tight">{history.length}</div>
          <div className="label text-muted mt-1.5">Resolved Reports</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-surface border border-line rounded-xl p-5">
          <div className="text-2xl font-black tracking-tight">+10</div>
          <div className="label text-muted mt-1.5">Per Resolved Report</div>
        </motion.div>
      </div>

      <div className="mt-6">
        <h3 className="text-base font-bold mb-4">Credit History</h3>
        <CreditsCard balance={balance} history={history} label="Available Credits" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface border border-line rounded-xl p-6 mt-6">
        <h3 className="text-base font-bold">How You Earn Credits</h3>

        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">Resolved Report</p>
              <p className="text-xs text-muted mt-0.5">Awarded automatically when admin resolves your report</p>
            </div>
            <span className="font-mono text-sm font-bold text-organic">+10</span>
          </div>
        </div>

        <p className="text-xs text-muted mt-4">Credits are added automatically once your report is resolved.</p>
      </motion.div>
    </div>
  )
}

export default Credits