import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle'
import { useAuth, type Role } from './AuthContext'

const linksByRole: Record<Role, { to: string; label: string; icon: string; end?: boolean }[]> = {
  user: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/report-waste', label: 'Report Waste', icon: '📍' },
    { to: '/my-reports', label: 'My Reports', icon: '📋' },
    { to: '/credits', label: 'Credits', icon: '⭐' },
    { to: '/notifications', label: 'Notifications', icon: '🔔' },
    { to: '/learning', label: 'Learn', icon: '🎓' },
    { to: '/rewards', label: 'Rewards', icon: '🏆' },
  ],
  cleaner: [
    { to: '/cleaner', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/cleaner/tasks', label: 'My Tasks', icon: '📋' },
    { to: '/cleaner/urgent', label: 'Urgent Requests', icon: '⚠️' },
    { to: '/cleaner/messages', label: 'Messages', icon: '💬' },
    { to: '/cleaner/credits', label: 'Credits', icon: '⭐' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: '🏠', end: true },
    { to: '/admin/verify', label: 'Verify Reports', icon: '✅' },
    { to: '/admin/reports', label: 'All Reports', icon: '📋' },
    { to: '/admin/cleaners', label: 'Cleaners', icon: '🧹' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/messages', label: 'Messages', icon: '💬' },
    { to: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  ],
}

function Sidebar() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const role = auth?.role ?? 'user'
  const links = linksByRole[role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-surface border-r border-line flex flex-col p-4 flex-shrink-0">
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-accent text-white flex items-center justify-center text-xs font-bold">CC</span>
          <span className="font-black text-base tracking-tight">CleanCity</span>
        </div>
      </div>

      {auth && (
        <div className="px-2 mb-4">
          <p className="text-sm font-medium truncate">{auth.name}</p>
          <span className="label text-muted capitalize">{auth.role}</span>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 3 }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-paper hover:text-ink'
                }`}
              >
                <span className="text-sm">{l.icon}</span>
                {l.label}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-4 border-t border-line">
        <div className="flex items-center justify-between px-2">
          <span className="label text-muted">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-muted hover:bg-paper hover:text-ink transition-colors"
        >
          ↩ Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar