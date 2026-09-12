import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThemeToggle from '../ThemeToggle'
import { useAuth, type Role } from '../AuthContext'

const roleRoutes: Record<Role, string> = {
  admin: '/admin',
  cleaner: '/cleaner',
  user: '/dashboard',
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const account = login(email, password)
      navigate(roleRoutes[account.role])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-6 relative transition-colors duration-300">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        className="w-full max-w-[880px] bg-surface border border-line rounded-2xl overflow-hidden card-elevated"
      >
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-10 md:p-12 bg-accent text-white flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-8">
              <span className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center text-sm font-mono">CC</span>
              <span className="font-black text-lg tracking-tight">CleanCity</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-[1.05] mb-4">
              Sorted streets start with one report.
            </h1>
            <p className="text-sm text-white/75 leading-relaxed mb-10 max-w-[320px]">
              Log in and we'll take you straight to your dashboard.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Organic', color: 'bg-organic' },
                { label: 'Plastic', color: 'bg-plastic' },
                { label: 'Paper', color: 'bg-paper-stream' },
                { label: 'Glass', color: 'bg-glass' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 text-sm font-mono text-white/80">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-10 md:p-12 bg-paper">
            <h2 className="text-xl font-bold tracking-tight mb-1">Log in</h2>
            <p className="text-sm text-muted mb-7">Access your CleanCity account</p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="label text-muted block mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-line rounded-md bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                />
              </div>

              <div>
                <label className="label text-muted block mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-line rounded-md bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-glass bg-accent-soft border border-line rounded-md px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

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
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-ink text-paper py-3 rounded-md font-medium text-sm mt-2 hover:bg-accent hover:text-white transition-colors"
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

            {/* Temporary — remove once real accounts/registration exist */}
            <div className="mt-6 pt-5 border-t border-line text-xs text-muted space-y-1">
              <p className="font-medium mb-1.5">Test accounts:</p>
              <p>user: priya@cleancity.com / user123</p>
              <p>cleaner: karthik@cleancity.com / cleaner123</p>
              <p>admin: divya@cleancity.com / admin123</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login