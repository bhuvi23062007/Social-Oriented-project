import { useState } from 'react'

interface Upload {
  id: string
  user: string
  location: string
  image: string
  submittedAt: string
  status: 'pending' | 'accepted' | 'rejected'
}

const initialUploads: Upload[] = [
  { id: 'U-101', user: 'Priya S.', location: 'Anna Nagar, 4th Ave', image: 'https://placehold.co/400x300', submittedAt: '10:22 AM', status: 'pending' },
  { id: 'U-102', user: 'Karthik R.', location: 'Velachery Main Rd', image: 'https://placehold.co/400x300', submittedAt: '9:47 AM', status: 'pending' },
  { id: 'U-103', user: 'Divya M.', location: 'T Nagar Bus Stand', image: 'https://placehold.co/400x300', submittedAt: '9:10 AM', status: 'pending' },
]

function CleanerDashboard() {
  const [uploads, setUploads] = useState(initialUploads)

  const updateStatus = (id: string, status: Upload['status']) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  }

  const pendingCount = uploads.filter((u) => u.status === 'pending').length

  return (
    <div className="cleaner-page">
      <div className="cleaner-header">
        <div>
          <h1>Pickup Queue</h1>
          <p>{pendingCount} reports awaiting review</p>
        </div>
      </div>

      <div className="cleaner-grid">
        {uploads.map((u) => (
          <div className="upload-card" key={u.id}>
            <img src={u.image} alt={`Waste report ${u.id}`} className="upload-img" />
            <div className="upload-body">
              <div className="upload-top">
                <span className="upload-id">{u.id}</span>
                <span
                  className={`report-status ${
                    u.status === 'pending' ? 'pending-status' : u.status === 'accepted' ? 'resolved-status' : 'rejected-status'
                  }`}
                >
                  {u.status}
                </span>
              </div>
              <div className="upload-loc">{u.location}</div>
              <div className="upload-meta">Submitted by {u.user} · {u.submittedAt}</div>

              {u.status === 'pending' && (
                <div className="upload-actions">
                  <button className="btn-confirm" onClick={() => updateStatus(u.id, 'accepted')}>
                    Confirm Collected
                  </button>
                  <button className="btn-reject" onClick={() => updateStatus(u.id, 'rejected')}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CleanerDashboard;