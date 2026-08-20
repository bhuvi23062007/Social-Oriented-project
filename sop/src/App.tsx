import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Sidebar from './Sidebar'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ReportWaste from './pages/ReportWaste'
import MyReports from './pages/MyReports'
import Rewards from './pages/Rewards'
import Login from './pages/Login'
import Register from './pages/Register'
import Learning from './pages/Learning'
import CleanerDashboard from './pages/CleanerDashboard'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home - No Sidebar */}
        <Route path="/" element={<Home />} />

        {/* Login & Register - No Sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard - With Sidebar */}
        <Route
          path="/dashboard"
          element={
            <div className="app-shell">
              <Sidebar />
              <main className="main-content">
                <Dashboard />
              </main>
            </div>
          }
        />

        {/* Report Waste - With Sidebar */}
        <Route
          path="/report-waste"
          element={
            <div className="app-shell">
              <Sidebar />
              <main className="main-content">
                <ReportWaste />
              </main>
            </div>
          }
        />

        {/* My Reports - With Sidebar */}
        <Route
          path="/my-reports"
          element={
            <div className="app-shell">
              <Sidebar />
              <main className="main-content">
                <MyReports />
              </main>
            </div>
          }
        />

        {/* Rewards - With Sidebar */}
        <Route
          path="/rewards"
          element={
            <div className="app-shell">
              <Sidebar />
              <main className="main-content">
                <Rewards />
              </main>
            </div>
          }
        />

        {/* Learning - With Sidebar */}
        <Route
          path="/learning"
          element={
            <div className="app-shell">
              <Sidebar />
              <main className="main-content">
                <Learning />
              </main>
            </div>
          }
        />

        {/* Cleaner Dashboard - With Sidebar */}
        <Route
          path="/cleaner"
          element={
            <div className="app-shell">
              <Sidebar />
              <main className="main-content">
                <CleanerDashboard />
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App