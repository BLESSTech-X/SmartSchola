import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Sidebar from './components/Sidebar'

import Login from './pages/Login'
import RegisterTeacher from './pages/RegisterTeacher'
import RegisterParent from './pages/RegisterParent'
import ParentLogin from './pages/ParentLogin'
import ParentPortal from './pages/ParentPortal'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import MarkEntry from './pages/MarkEntry'
import Results from './pages/Results'
import FeeTracker from './pages/FeeTracker'
import SMS from './pages/SMS'
import Settings from './pages/Settings'
import AdminApprovals from './pages/AdminApprovals'
import NotFound from './pages/NotFound'

function StaffLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, currentUser, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-2 border-navy/20 border-t-gold rounded-full animate-spin" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (currentUser?.role === 'parent') return <Navigate to="/parent" replace />
  if (roles && !roles.includes(currentUser?.role)) return <Navigate to="/dashboard" replace />
  return <StaffLayout>{children}</StaffLayout>
}

function ParentRoute({ children }) {
  const { isAuthenticated, currentUser, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-2 border-navy/20 border-t-gold rounded-full animate-spin" /></div>
  if (!isAuthenticated) return <Navigate to="/parent-login" replace />
  if (currentUser?.role !== 'parent') return <Navigate to="/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { isAuthenticated, currentUser, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) {
    return currentUser?.role === 'parent' ? <Navigate to="/parent" replace /> : <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/parent-login" element={<GuestRoute><ParentLogin /></GuestRoute>} />
            <Route path="/register/teacher" element={<RegisterTeacher />} />
            <Route path="/register/parent" element={<RegisterParent />} />

            {/* Parent Portal */}
            <Route path="/parent" element={<ParentRoute><ParentPortal /></ParentRoute>} />

            {/* Staff — admin + teacher */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/marks" element={<ProtectedRoute><MarkEntry /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
            <Route path="/fees" element={<ProtectedRoute roles={['admin']}><FeeTracker /></ProtectedRoute>} />
            <Route path="/sms" element={<ProtectedRoute roles={['admin']}><SMS /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute roles={['admin']}><AdminApprovals /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
