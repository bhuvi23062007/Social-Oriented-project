


     import './Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <div>
          <h1>Welcome back! 👋</h1>
          <p>Help keep your community clean and green.</p>
        </div>

        <div className="user-avatar">
          👤
        </div>
      </div>

      <div className="stats-container">

        <div className="stat-card">
          <div className="stat-icon">🗑️</div>
          <div>
            <h2>5</h2>
            <p>Total Reports</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div>
            <h2>120</h2>
            <p>Reward Points</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <h2>3</h2>
            <p>Resolved Reports</p>
          </div>
        </div>

      </div>

      <div className="dashboard-section">
        <h2>Quick Actions</h2>

        <div className="action-container">

          <div className="action-card">
            <div className="action-icon">📸</div>
            <h3>Report Waste</h3>
            <p>Found waste in your area? Report it and help keep your community clean.</p>
           
           <button onClick={() => window.location.href = '/report-waste'}>
  Report Now
</button> 
          </div>

          <div className="action-card">
            <div className="action-icon">📍</div>
            <h3>My Reports</h3>
            <p>View your previous reports and track their current status.</p>
           
           <button onClick={() => window.location.href = '/my-reports'}>
  View Reports
</button> 
          </div>

          <div className="action-card">
            <div className="action-icon">🎁</div>
            <h3>Rewards</h3>
            <p>Check your reward points and explore available rewards.</p>
          
          <button onClick={() => window.location.href = '/rewards'}>
  View Rewards
</button>  
          </div>

        </div>
      </div>

      <div className="recent-reports">

        <div className="section-heading">
          <h2>Recent Reports</h2>
          <button>View All</button>
        </div>

        <div className="report-item">
          <div>
            <h3>Garbage near Main Road</h3>
            <p>📍 Main Road • 2 days ago</p>
          </div>

          <span className="status pending">
            Pending
          </span>
        </div>

        <div className="report-item">
          <div>
            <h3>Plastic waste near Park</h3>
            <p>📍 City Park • 5 days ago</p>
          </div>

          <span className="status resolved">
            Resolved
          </span>
        </div>

      </div>

    </div>
  )
}

export default Dashboard