import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Landing from './pages/Landing.jsx'
import SchoolProfile from './pages/SchoolProfile.jsx'
import Login from './pages/Login.jsx'
import SchoolSignIn from './pages/SchoolSignIn.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import MarkEntry from './pages/MarkEntry.jsx'
import Results from './pages/Results.jsx'
import FeeTracker from './pages/FeeTracker.jsx'
import SMS from './pages/SMS.jsx'
import Settings from './pages/Settings.jsx'

function ProtectedLayout() {
  const { isAuthenticated, currentUser } = useAuth()
  const location = useLocation()
  const routeNames = { '/workspace': 'School overview', '/workspace/students': 'Students & learners', '/workspace/marks': 'Mark entry', '/workspace/results': 'Academic results', '/workspace/fees': 'Fee tracker', '/workspace/sms': 'School communications', '/workspace/settings': 'Workspace settings' }
  const pageTitle = routeNames[location.pathname] || 'School workspace'
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <header className="workspace-topbar"><div><span className="workspace-topbar-kicker">SMARTSCHOLA WORKSPACE</span><h1>{pageTitle}</h1></div><div className="workspace-topbar-actions"><span className="workspace-user-chip"><span>{(currentUser?.full_name || currentUser?.name || 'U').slice(0,1).toUpperCase()}</span><strong>{currentUser?.full_name || currentUser?.name || 'School user'}</strong><small>{currentUser?.role || 'Authorised user'}</small></span><Link to="/" className="workspace-home-link">Public site ↗</Link></div></header>
        <div className="page-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="marks" element={<MarkEntry />} />
            <Route path="results" element={<Results />} />
            <Route path="fees" element={<FeeTracker />} />
            <Route path="sms" element={<SMS />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/workspace" replace />} />
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
            <Route path="/" element={<Landing />} />
            <Route path="/s/:slug" element={<SchoolProfile />} />
            <Route path="/school-sign-in" element={<SchoolSignIn />} />
            <Route path="/login" element={<Login />} />
            <Route path="/workspace/*" element={<ProtectedLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
