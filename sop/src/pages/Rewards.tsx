
import { motion, type Variants } from 'framer-motion'

const earnItems = [
  {
    icon: '📸',
    title: 'Report Waste',
    desc: 'Submit a valid waste report.',
    points: '+20',
  },
  {
    icon: '📍',
    title: 'Verified Report',
    desc: 'Your report gets verified.',
    points: '+30',
  },
  {
    icon: '🌱',
    title: 'Community Cleanup',
    desc: 'Participate in cleanup activities.',
    points: '+50',
  },
]

const rewardItems = [
  {
    icon: '🌱',
    title: 'Eco-Friendly Plant',
    desc: 'Get a small plant for your home.',
    points: '100',
  },
  {
    icon: '🛍️',
    title: 'Eco Shopping Bag',
    desc: 'Reusable shopping bag for daily use.',
    points: '150',
  },
  {
    icon: '🎁',
    title: 'Community Gift',
    desc: 'Special reward for active contributors.',
    points: '250',
  },
]

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
    },
  },
}

function Rewards() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="label text-accent">Rewards</span>

        <h1 className="text-3xl font-black tracking-tighter mt-1">
          Rewards
        </h1>

        <p className="text-muted text-sm mt-1">
          Earn points by helping keep your community clean.
        </p>
      </div>

      {/* Available Points */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: 'easeOut',
        }}
        className="bg-accent text-white rounded-2xl p-7 flex items-center gap-5 mb-10"
      >
        <span className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center text-2xl">
          🏆
        </span>

        <div>
          <p className="text-xs opacity-80 mb-1">
            Available Points
          </p>

          <h2 className="text-2xl font-black tracking-tight">
            120 Points
          </h2>

          <span className="text-xs opacity-75">
            Keep reporting waste to earn more points!
          </span>
        </div>
      </motion.div>

      {/* How to Earn Points */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">
          How to Earn Points
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {earnItems.map((e) => (
            <motion.div
              key={e.title}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              whileHover={{
                y: -5,
                borderColor: 'var(--color-accent)',
              }}
              className="bg-surface border border-line rounded-xl p-6 transition-colors cursor-default"
            >
              <span className="w-11 h-11 rounded-lg bg-accent-soft text-accent flex items-center justify-center text-lg mb-4">
                {e.icon}
              </span>

              <h3 className="text-base font-bold mb-1.5">
                {e.title}
              </h3>

              <p className="text-sm text-muted leading-relaxed mb-3">
                {e.desc}
              </p>

              <strong className="text-accent font-mono text-sm">
                {e.points} Points
              </strong>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Available Rewards */}
      <section>
        <h2 className="text-lg font-bold mb-4">
          Available Rewards
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {rewardItems.map((r) => (
            <motion.div
              key={r.title}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              whileHover={{
                y: -5,
                borderColor: '#3b82f6',
              }}
              className="bg-surface border border-line rounded-xl p-6 transition-colors cursor-pointer"
            >
              {/* Reward Image / Icon */}
              <div className="h-28 rounded-lg bg-accent-soft flex items-center justify-center text-4xl mb-4">
                {r.icon}
              </div>

              <h3 className="text-base font-bold mb-1.5">
                {r.title}
              </h3>

              <p className="text-sm text-muted leading-relaxed mb-4">
                {r.desc}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-line">
                <span className="font-mono text-sm text-accent font-medium">
                  {r.points} Points
                </span>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-ink text-paper px-4 py-1.5 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors"
                >
                  Redeem
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Rewards