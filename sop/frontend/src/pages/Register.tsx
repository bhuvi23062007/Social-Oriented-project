

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThemeToggle from '../ThemeToggle'

function Register() {
  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-6 relative transition-colors duration-300">

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[920px] bg-surface border border-line rounded-2xl overflow-hidden card-elevated"
      >
        <div className="flex flex-col md:flex-row">
          {/* Left panel */}
          <div className="flex-1 p-10 md:p-12 bg-accent text-white flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-8">
              <span className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center text-sm font-mono">CC</span>
              <span className="font-black text-lg tracking-tight">CleanCity</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-[1.05] mb-4">
              Join CleanCity.
            </h1>
            <p className="text-sm text-white/75 leading-relaxed mb-10 max-w-[320px]">
              Become part of the community and help create a cleaner,
              greener environment.
            </p>

            <div className="space-y-3">
              {[
                { icon: '📸', label: 'Report waste in your area' },
                { icon: '🌱', label: 'Support a cleaner community' },
                { icon: '🏆', label: 'Earn rewards for your contribution' },
              ].map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 text-sm text-white/85"
                >
                  <span>{b.icon}</span>
                  {b.label}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right form */}
          <div className="flex-1 p-10 md:p-12 bg-paper">
            <h2 className="text-xl font-bold tracking-tight mb-1">Create account</h2>
            <p className="text-sm text-muted mb-6">Join the CleanCity community today</p>

            <form className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-muted block mb-1.5">First name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    required
                    className="w-full border border-line rounded-md bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                  />
                </div>
                <div>
                  <label className="label text-muted block mb-1.5">Last name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    required
                    className="w-full border border-line rounded-md bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="label text-muted block mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full border border-line rounded-md bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                />
              </div>

              <div>
                <label className="label text-muted block mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  required
                  className="w-full border border-line rounded-md bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                />
              </div>

              <div>
                <label className="label text-muted block mb-1.5">Confirm password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  required
                  className="w-full border border-line rounded-md bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-ink text-paper py-3 rounded-md font-medium text-sm mt-2 hover:bg-accent hover:text-white transition-colors"
              >
                Create account
              </motion.button>
            </form>

            <div className="text-center mt-5 text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Register