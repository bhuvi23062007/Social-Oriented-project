import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home-page">

      <nav className="home-navbar">

        <div className="home-logo">
          <span>♻️</span>
          <div>
            <h2>CleanCity</h2>
            <small>Community Portal</small>
          </div>
        </div>

        <div className="home-nav-links">
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>

          <Link to="/login" className="nav-login">
            Login
          </Link>

          <Link to="/register" className="nav-register">
            Get Started
          </Link>
        </div>

      </nav>

      <section className="hero-section">

        <div className="hero-content">

          <span className="hero-badge">
            🌱 Together for a Cleaner Community
          </span>

          <h1>
            Keep Your Community
            <span> Clean & Green</span>
          </h1>

          <p>
            Report waste in your area, help improve cleanliness,
            and earn rewards for making a positive impact.
          </p>

          <div className="hero-buttons">

            <Link to="/register" className="primary-button">
              Get Started →
            </Link>

            <Link to="/login" className="secondary-button">
              Login
            </Link>

          </div>

        </div>

        <div className="hero-visual">
          <div className="eco-circle">
            ♻️
          </div>

          <div className="floating-card card-one">
            📸
            <div>
              <strong>Report Waste</strong>
              <span>Make your area cleaner</span>
            </div>
          </div>

          <div className="floating-card card-two">
            🏆
            <div>
              <strong>Earn Rewards</strong>
              <span>Get points for your impact</span>
            </div>
          </div>
        </div>

      </section>

      <section id="how-it-works" className="how-section">

        <div className="section-title">
          <span>HOW IT WORKS</span>
          <h2>Make a Difference in 3 Steps</h2>
        </div>

        <div className="steps-container">

          <div className="step-card">
            <div className="step-icon">📸</div>
            <h3>Report</h3>
            <p>
              Capture and report waste problems
              in your community.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon">🔍</div>
            <h3>Verify</h3>
            <p>
              Reports are reviewed and tracked
              by the community.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon">🏆</div>
            <h3>Earn Rewards</h3>
            <p>
              Earn points and rewards for
              your contribution.
            </p>
          </div>

        </div>

      </section>

      <section id="about" className="impact-section">

        <div>
          <span>OUR MISSION</span>
          <h2>Small Actions Create a Big Impact.</h2>
        </div>

        <p>
          CleanCity connects citizens with their community
          to create cleaner streets, responsible waste
          management, and a healthier environment.
        </p>

      </section>

      <footer className="home-footer">
        <div>
          <strong>♻️ CleanCity</strong>
          <span>Building cleaner communities together.</span>
        </div>

        <p>© 2026 CleanCity. Community Portal.</p>
      </footer>

    </div>
  )
}

export default Home