import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'

const reports = [
  {
    title: 'Garbage near Main Road',
    loc: 'Main Road',
    status: 'Pending',
    color: 'bg-paper-stream',
    desc: 'Large amount of mixed waste has been dumped near the main road.',
    time: 'Reported 2 days ago',
    num: '#001',
  },
  {
    title: 'Plastic Waste near Park',
    loc: 'City Park',
    status: 'Resolved',
    color: 'bg-organic',
    desc: 'Plastic bottles and other plastic waste were found around the park.',
    time: 'Reported 5 days ago',
    num: '#002',
  },
  {
    title: 'Food Waste Dump',
    loc: 'Market Area',
    status: 'Resolved',
    color: 'bg-organic',
    desc: 'Food waste was left outside the market after closing time.',
    time: 'Reported 1 week ago',
    num: '#003',
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

function MyReports() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="label text-accent">Reports</span>

          <h1 className="text-3xl font-black tracking-tighter mt-1">
            My Reports
          </h1>

          <p className="text-muted text-sm mt-1">
            Track the waste reports you have submitted.
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            to="/report-waste"
            className="bg-ink text-paper px-5 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-white transition-colors"
          >
            + New Report
          </Link>
        </motion.div>
      </div>

      {/* Report Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Reports', value: '5', icon: '📋' },
          { label: 'Pending', value: '2', icon: '⏳' },
          { label: 'Resolved', value: '3', icon: '✅' },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            whileHover={{
              y: -4,
              borderColor: '#3b82f6',
            }}
            className="bg-surface border border-line rounded-xl p-5 flex items-center gap-3 transition-colors cursor-pointer"
          >
            <span className="w-10 h-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center text-base">
              {s.icon}
            </span>

            <div>
              <div className="text-xl font-black tracking-tight">
                {s.value}
              </div>

              <div className="label text-muted mt-0.5">
                {s.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.map((r) => (
          <motion.div
            key={r.num}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            whileHover={{
              borderColor: '#3b82f6',
            }}
            className="bg-surface border border-line rounded-xl p-5 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2.5">
              <div>
                <h3 className="text-base font-bold">
                  {r.title}
                </h3>

                <p className="text-xs text-muted mt-1">
                  📍 {r.loc}
                </p>
              </div>

              <span
                className={`label px-2.5 py-1 rounded-full ${
                  r.status === 'Pending'
                    ? 'bg-accent-soft text-paper-stream'
                    : 'bg-accent-soft text-organic'
                }`}
              >
                {r.status}
              </span>
            </div>

            <p className="text-sm text-muted leading-relaxed mb-4">
              {r.desc}
            </p>

            <div className="flex justify-between text-xs text-muted pt-3 border-t border-line">
              <span>{r.time}</span>
              <span>Report {r.num}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default MyReports