
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Sidebar from './Sidebar'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ReportWaste from './pages/ReportWaste'
import MyReports from './pages/MyReports'
import Rewards from './pages/Rewards'
import Login from './pages/Login'
import Register from './pages/Register'

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
            <>
              <Sidebar />
              <main className="main-content">
                <Dashboard />
              </main>
            </>
          }
        />

        {/* Report Waste - With Sidebar */}
        <Route
          path="/report-waste"
          element={
            <>
              <Sidebar />
              <main className="main-content">
                <ReportWaste />
              </main>
            </>
          }
        />

        {/* My Reports - With Sidebar */}
        <Route
          path="/my-reports"
          element={
            <>
              <Sidebar />
              <main className="main-content">
                <MyReports />
              </main>
            </>
          }
        />

        {/* Rewards - With Sidebar */}
        <Route
          path="/rewards"
          element={
            <>
              <Sidebar />
              <main className="main-content">
                <Rewards />
              </main>
            </>
          }
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App