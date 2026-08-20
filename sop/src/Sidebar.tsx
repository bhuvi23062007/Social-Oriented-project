import { NavLink } from 'react-router-dom'


const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/report-waste', label: 'Report Waste', icon: '📸' },
  { to: '/my-reports', label: 'My Reports', icon: '📋' },
  { to: '/learning', label: 'Learn', icon: '🎓' },
  { to: '/rewards', label: 'Rewards', icon: '🏆' },
  { to: '/cleaner', label: 'Cleaner Dashboard', icon: '🧹' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">♻️</span> CleanCity
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-link-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar