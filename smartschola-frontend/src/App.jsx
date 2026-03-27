// Smart Schola Frontend — React + Vite + Tailwind
// =====================================================
// SETUP & RUN (Windows Command Prompt):
//   cd smartschola-frontend
//   npm install
//   copy .env.example .env
//   npm run dev
//   Open: http://localhost:5173
//
// BUILD FOR PRODUCTION:
//   npm run build
//
// DEPLOY TO VERCEL:
//   npm install -g vercel
//   vercel login
//   vercel --prod
//   Set in Vercel Dashboard: VITE_API_URL=https://your-backend.vercel.app
// =====================================================

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
    <BrowserRouter>
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
