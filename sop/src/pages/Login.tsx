import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const streamColors = ['bg-organic', 'bg-plastic', 'bg-paper-stream', 'bg-glass']

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[880px] bg-surface border border-line rounded-lg overflow-hidden"
      >
        {/* Signature stream bar */}
        <div className="stream-bar">
          {streamColors.map((c) => (
            <span key={c} className={c} />
          ))}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left panel */}
          <div className="flex-1 p-10 md:p-12 border-b md:border-b-0 md:border-r border-line">
            <div className="flex items-center gap-2 mb-8">
              <span className="w-8 h-8 rounded-sm bg-ink text-paper flex items-center justify-center text-sm font-mono">
                CC
              </span>
              <span className="font-display font-bold text-lg tracking-tight">CleanCity</span>
            </div>

            <h1 className="text-3xl md:text-[34px] leading-[1.1] mb-4">
              Sorted streets start with one report.
            </h1>
            <p className="text-muted text-sm leading-relaxed mb-10 max-w-[320px]">
              Track pickups, verify reports, and see exactly where your
              contribution goes — organic, plastic, paper, or glass.
            </p>

            <div className="space-y-3">
              {[
                { label: 'Organic', color: 'bg-organic' },
                { label: 'Plastic', color: 'bg-plastic' },
                { label: 'Paper', color: 'bg-paper-stream' },
                { label: 'Glass', color: 'bg-glass' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.07 }}
                  className="flex items-center gap-3 text-sm font-mono text-muted"
                >
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  {s.label}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right form */}
          <div className="flex-1 p-10 md:p-12">
            <h2 className="text-xl mb-1">Log in</h2>
            <p className="text-sm text-muted mb-7">Access your CleanCity account</p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-muted mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-line rounded-sm bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-muted mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-line rounded-sm bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="flex justify-between items-center text-xs text-muted pt-1">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="accent-accent" />
                  Remember me
                </label>
                <a href="#" className="text-accent font-medium hover:underline">
                  Forgot password?
                </a>
              </div>

              <motion.button
                whileHover={{ backgroundColor: '#2E46E0' }}
                type="submit"
                className="w-full bg-accent text-white py-3 rounded-sm font-medium text-sm mt-2 transition-colors"
              >
                Log in →
              </motion.button>
            </form>

            <div className="text-center mt-6 text-sm text-muted">
              No account?{' '}
              <Link to="/register" className="text-accent font-medium hover:underline">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login