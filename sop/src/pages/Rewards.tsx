import './Rewards.css'

function Rewards() {
  return (
    <div className="rewards-page">

      {/* Header */}
      <div className="rewards-header">
        <div>
          <h1>Rewards</h1>
          <p>Earn points by helping keep your community clean.</p>
        </div>
      </div>

      {/* Points Card */}
      <div className="points-card">

        <div className="points-icon">
          🏆
        </div>

        <div>
          <p>Available Points</p>
          <h2>120 Points</h2>
          <span>Keep reporting waste to earn more points!</span>
        </div>

      </div>

      {/* How to Earn */}
      <section className="earn-section">

        <h2>How to Earn Points</h2>

        <div className="earn-container">

          <div className="earn-card">
            <div className="earn-icon">📸</div>
            <h3>Report Waste</h3>
            <p>Submit a valid waste report.</p>
            <strong>+20 Points</strong>
          </div>

          <div className="earn-card">
            <div className="earn-icon">📍</div>
            <h3>Verified Report</h3>
            <p>Your report gets verified.</p>
            <strong>+30 Points</strong>
          </div>

          <div className="earn-card">
            <div className="earn-icon">🌱</div>
            <h3>Community Cleanup</h3>
            <p>Participate in cleanup activities.</p>
            <strong>+50 Points</strong>
          </div>

        </div>

      </section>

      {/* Available Rewards */}
      <section className="available-rewards">

        <h2>Available Rewards</h2>

        <div className="rewards-container">

          <div className="reward-card">
            <div className="reward-image">🌱</div>
            <h3>Eco-Friendly Plant</h3>
            <p>Get a small plant for your home.</p>
            <div className="reward-bottom">
              <span>100 Points</span>
              <button>Redeem</button>
            </div>
          </div>

          <div className="reward-card">
            <div className="reward-image">🛍️</div>
            <h3>Eco Shopping Bag</h3>
            <p>Reusable shopping bag for daily use.</p>
            <div className="reward-bottom">
              <span>150 Points</span>
              <button>Redeem</button>
            </div>
          </div>

          <div className="reward-card">
            <div className="reward-image">🎁</div>
            <h3>Community Gift</h3>
            <p>Special reward for active contributors.</p>
            <div className="reward-bottom">
              <span>250 Points</span>
              <button>Redeem</button>
            </div>
          </div>

        </div>

      </section>

    </div>
  )
}

export default Rewards