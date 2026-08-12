import { NavLink, Link } from 'react-router-dom'
import './Sidebar.css'

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <div className="logo-icon">♻️</div>

        <div>
          <h2>CleanCity</h2>
          <span>Community Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">

        <p className="nav-title">MENU</p>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <span>🏠</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/report-waste"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <span>📸</span>
          Report Waste
        </NavLink>

        <NavLink
          to="/my-reports"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <span>📋</span>
          My Reports
        </NavLink>

        <NavLink
          to="/rewards"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <span>🏆</span>
          Rewards
        </NavLink>

      </nav>

      <div className="sidebar-bottom">

        <div className="user-box">
          <div className="user-avatar-small">👤</div>

          <div>
            <strong>User</strong>
            <span>Community Member</span>
          </div>
        </div>

        <Link to="/login" className="logout-link">
          <span>🚪</span>
          Logout
        </Link>

      </div>

    </aside>
  )
}

export default Sidebar