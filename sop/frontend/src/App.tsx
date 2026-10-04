import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

import Dashboard from './pages/Dashboard'
import ReportWaste from './pages/ReportWaste'
import MyReports from './pages/MyReports'
import UserCredits from './pages/Credits'
import UserNotifications from './pages/Notifications'
import Rewards from './pages/Rewards'
import Learning from './pages/Learning'

import CleanerHome from './pages/cleaner/CleanerHome'
import MyTasks from './pages/cleaner/MyTasks'
import UrgentRequests from './pages/cleaner/UrgentRequests'
import CleanerMessages from './pages/cleaner/CleanerMessages'
import CleanerCredits from './pages/cleaner/CleanerCredits'

import AdminHome from './pages/admin/AdminHome'
import VerifyReports from './pages/admin/VerifyReports'
import AllReports from './pages/admin/AllReports'
import Cleaners from './pages/admin/Cleaners'
import Users from './pages/admin/Users'
import AdminMessages from './pages/admin/AdminMessages'
import AdminNotifications from './pages/admin/AdminNotifications'

import './App.css'

function withSidebar(children: React.ReactNode) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen */}
        <Route path="/dashboard" element={<ProtectedRoute allow={['CITIZEN']}>{withSidebar(<Dashboard />)}</ProtectedRoute>} />
        <Route path="/report-waste" element={<ProtectedRoute allow={['CITIZEN']}>{withSidebar(<ReportWaste />)}</ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute allow={['CITIZEN']}>{withSidebar(<MyReports />)}</ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute allow={['CITIZEN']}>{withSidebar(<UserCredits />)}</ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allow={['CITIZEN']}>{withSidebar(<UserNotifications />)}</ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute allow={['CITIZEN']}>{withSidebar(<Rewards />)}</ProtectedRoute>} />

        {/* Cleaner */}
        <Route path="/cleaner" element={<ProtectedRoute allow={['CLEANING_STAFF']}>{withSidebar(<CleanerHome />)}</ProtectedRoute>} />
        <Route path="/cleaner/tasks" element={<ProtectedRoute allow={['CLEANING_STAFF']}>{withSidebar(<MyTasks />)}</ProtectedRoute>} />
        <Route path="/cleaner/urgent" element={<ProtectedRoute allow={['CLEANING_STAFF']}>{withSidebar(<UrgentRequests />)}</ProtectedRoute>} />
        <Route path="/cleaner/messages" element={<ProtectedRoute allow={['CLEANING_STAFF']}>{withSidebar(<CleanerMessages />)}</ProtectedRoute>} />
        <Route path="/cleaner/credits" element={<ProtectedRoute allow={['CLEANING_STAFF']}>{withSidebar(<CleanerCredits />)}</ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allow={['ADMIN']}>{withSidebar(<AdminHome />)}</ProtectedRoute>} />
        <Route path="/admin/verify" element={<ProtectedRoute allow={['ADMIN']}>{withSidebar(<VerifyReports />)}</ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allow={['ADMIN']}>{withSidebar(<AllReports />)}</ProtectedRoute>} />
        <Route path="/admin/cleaners" element={<ProtectedRoute allow={['ADMIN']}>{withSidebar(<Cleaners />)}</ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allow={['ADMIN']}>{withSidebar(<Users />)}</ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute allow={['ADMIN']}>{withSidebar(<AdminMessages />)}</ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allow={['ADMIN']}>{withSidebar(<AdminNotifications />)}</ProtectedRoute>} />

        {/* Shared */}
        <Route path="/learning" element={<ProtectedRoute allow={['CITIZEN', 'CLEANING_STAFF', 'ADMIN']}>{withSidebar(<Learning />)}</ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App