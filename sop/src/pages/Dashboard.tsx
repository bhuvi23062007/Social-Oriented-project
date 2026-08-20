

const recentReports = [
  { id: 'RPT-241', location: 'Anna Nagar, 4th Ave', status: 'Pending', date: 'Aug 12' },
  { id: 'RPT-238', location: 'Velachery Main Rd', status: 'Resolved', date: 'Aug 09' },
  { id: 'RPT-231', location: 'T Nagar Bus Stand', status: 'Pending', date: 'Aug 05' },
]

function Dashboard() {
  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1>Welcome back</h1>
          <p>Here's what's happening with your reports</p>
        </div>
        <button className="dash-cta">+ Report Waste</button>
      </div>

      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-value">18</div>
          <div className="dash-stat-label">Total Reports</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value accent">14</div>
          <div className="dash-stat-label">Resolved</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">3</div>
          <div className="dash-stat-label">Pending</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">420</div>
          <div className="dash-stat-label">Points Earned</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <h3>Recent Reports</h3>
          <div className="dash-report-list">
            {recentReports.map((r) => (
              <div className="dash-report-row" key={r.id}>
                <div>
                  <div className="dash-report-id">{r.id}</div>
                  <div className="dash-report-loc">{r.location}</div>
                </div>
                <div className="dash-report-right">
                  <span className={`report-status ${r.status === 'Pending' ? 'pending-status' : 'resolved-status'}`}>
                    {r.status}
                  </span>
                  <div className="dash-report-date">{r.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <h3>Your Impact</h3>
          <p className="dash-impact-text">Keep reporting to climb the community leaderboard.</p>
          <div className="impact-bar">
            <div className="impact-fill" style={{ width: '68%' }} />
          </div>
          <p className="dash-impact-sub">680 / 1000 points to next reward tier</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard