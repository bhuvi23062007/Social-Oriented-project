import { Link } from 'react-router-dom'


function Register() {
  return (
    <div className="register-page">

      <div className="register-container">

        {/* Left Section */}

        <div className="register-info">

          <div className="register-logo">
            ♻️
          </div>

          <h1>Join CleanCity</h1>

          <p>
            Become part of the community and help
            create a cleaner and greener environment.
          </p>

          <div className="register-benefits">
            <div>📸 Report waste in your area</div>
            <div>🌱 Support a cleaner community</div>
            <div>🏆 Earn rewards for your contribution</div>
          </div>

        </div>

        {/* Register Form */}

        <div className="register-form-section">

          <div className="register-form-header">
            <h2>Create Account</h2>
            <p>Join the CleanCity community today</p>
          </div>

          <form>

            <div className="form-row">

              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="First name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  required
                />
              </div>

            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button type="submit" className="register-button">
              Create Account
            </button>

          </form>

          <div className="login-text">
            Already have an account?
            <Link to="/login"> Login</Link>
          </div>

        </div>

      </div>

    </div>
  )
}

export default Register