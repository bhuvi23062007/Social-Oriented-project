import './MyReports.css'

function MyReports() {
  return (
    <div className="my-reports-page">

      <div className="reports-header">
        <div>
          <h1>My Reports</h1>
          <p>Track the waste reports you have submitted.</p>
        </div>

        <button className="new-report-btn">
          + New Report
        </button>
      </div>

      <div className="report-summary">

        <div className="summary-card">
          <span className="summary-icon">📋</span>
          <div>
            <h2>5</h2>
            <p>Total Reports</p>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-icon">⏳</span>
          <div>
            <h2>2</h2>
            <p>Pending</p>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-icon">✅</span>
          <div>
            <h2>3</h2>
            <p>Resolved</p>
          </div>
        </div>

      </div>

      <div className="reports-list">

        <div className="report-card">

          <div className="report-card-top">
            <div>
              <h3>Garbage near Main Road</h3>
              <p>📍 Main Road</p>
            </div>

            <span className="report-status pending-status">
              Pending
            </span>
          </div>

          <p className="report-description">
            Large amount of mixed waste has been dumped
            near the main road.
          </p>

          <div className="report-footer">
            <span>Reported 2 days ago</span>
            <span>Report #001</span>
          </div>

        </div>

        <div className="report-card">

          <div className="report-card-top">
            <div>
              <h3>Plastic Waste near Park</h3>
              <p>📍 City Park</p>
            </div>

            <span className="report-status resolved-status">
              Resolved
            </span>
          </div>

          <p className="report-description">
            Plastic bottles and other plastic waste
            were found around the park.
          </p>

          <div className="report-footer">
            <span>Reported 5 days ago</span>
            <span>Report #002</span>
          </div>

        </div>

        <div className="report-card">

          <div className="report-card-top">
            <div>
              <h3>Food Waste Dump</h3>
              <p>📍 Market Area</p>
            </div>

            <span className="report-status resolved-status">
              Resolved
            </span>
          </div>

          <p className="report-description">
            Food waste was left outside the market
            after closing time.
          </p>

          <div className="report-footer">
            <span>Reported 1 week ago</span>
            <span>Report #003</span>
          </div>

        </div>

      </div>

    </div>
  )
}

export default MyReports