import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import MarkEntry from './pages/MarkEntry.jsx'
import Results from './pages/Results.jsx'
import FeeTracker from './pages/FeeTracker.jsx'
import SMS from './pages/SMS.jsx'
import Settings from './pages/Settings.jsx'

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs sm:text-sm text-amber-900">
          <strong>DEMO MODE:</strong> Use fictional test information only. Login is hard-coded; connected modules may still require their configured backend.
        </div>
        <div className="page-enter">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/marks" element={<MarkEntry />} />
            <Route path="/results" element={<Results />} />
            <Route path="/fees" element={<FeeTracker />} />
            <Route path="/sms" element={<SMS />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/SmartSchola">
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
