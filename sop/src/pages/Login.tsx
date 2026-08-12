
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="login-page">

      <div className="login-container">

        {/* Left Section */}
        <div className="login-info">

          <div className="login-logo">
            ♻️
          </div>

          <h1>CleanCity</h1>

          <p>
            Together we can build cleaner,
            greener and healthier communities.
          </p>

          <div className="login-benefits">
            <div>🌱 Keep your community clean</div>
            <div>📸 Report waste easily</div>
            <div>🏆 Earn rewards for your contribution</div>
          </div>

        </div>

        {/* Login Form */}
        <div className="login-form-section">

          <div className="login-form-header">
            <h2>Welcome Back</h2>
            <p>Login to your CleanCity account</p>
          </div>

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <label>
                <input type="checkbox" />
                Remember me
              </label>

              <a href="#">Forgot Password?</a>
            </div>

            <button type="submit" className="login-button">
              Login
            </button>

          </form>

          <div className="register-text">
            Don't have an account?
            <Link to="/register"> Create Account</Link>
          </div>

        </div>

      </div>

    </div>
  )
}

export default Login