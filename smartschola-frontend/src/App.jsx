import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Landing from './pages/Landing.jsx'
import SchoolProfile from './pages/SchoolProfile.jsx'
import Login from './pages/Login.jsx'
import SchoolSignIn from './pages/SchoolSignIn.jsx'
import SchoolRegistration from './pages/SchoolRegistration.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import Classes from './pages/Classes.jsx'
import AcademicYears from './pages/AcademicYears.jsx'
import MarkEntry from './pages/MarkEntry.jsx'
import StudentAccess from './pages/StudentAccess.jsx'
import Results from './pages/Results.jsx'
import FeeTracker from './pages/FeeTracker.jsx'
import SMS from './pages/SMS.jsx'
import Settings from './pages/Settings.jsx'
import PlatformAdmin from './pages/PlatformAdmin.jsx'

const routeNames = {
  '/workspace': 'Dashboard',
  '/workspace/students': 'Students & learners',
  '/workspace/classes': 'Classes & streams',
  '/workspace/academic-years': 'Academic years',
  '/workspace/marks': 'Assessments & marks',
  '/workspace/student-access': 'Student & parent access',
  '/workspace/results': 'Academic results',
  '/workspace/fees': 'Fee management',
  '/workspace/sms': 'School communications',
  '/workspace/settings': 'Workspace settings'
}

function ProtectedLayout() {
  const { isAuthenticated, currentUser } = useAuth()
  const location = useLocation()
  const role = currentUser?.role
  const isSchoolAdmin = ['headmaster', 'admin'].includes(role)
  const isTeachingStaff = ['headmaster', 'admin', 'teacher'].includes(role)
  const pageTitle = routeNames[location.pathname] || 'School workspace'

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <div className="app-shell">
    <Sidebar/>
    <main className="app-main">
      <header className="workspace-topbar">
        <div><span className="workspace-topbar-kicker">SMARTSCHOLA · {role === 'teacher' ? 'TEACHING' : role === 'student' ? 'STUDENT' : role === 'parent' ? 'PARENT' : 'SCHOOL'} WORKSPACE</span><h1>{pageTitle}</h1></div>
        <div className="workspace-topbar-actions">
          <span className="workspace-user-chip"><span>{(currentUser?.full_name || currentUser?.name || 'U').slice(0,1).toUpperCase()}</span><strong>{currentUser?.full_name || currentUser?.name || 'School user'}</strong><small>{role || 'Authorised user'}</small></span>
          <Link to="/" className="workspace-home-link">Public site ↗</Link>
        </div>
      </header>
      <div className="page-content">
        <Routes>
          <Route index element={<Dashboard/>}/>
          <Route path="students" element={isSchoolAdmin ? <Students/> : <Navigate to="/workspace" replace/>}/>
          <Route path="classes" element={isSchoolAdmin ? <Classes/> : <Navigate to="/workspace" replace/>}/>
          <Route path="academic-years" element={isSchoolAdmin ? <AcademicYears/> : <Navigate to="/workspace" replace/>}/>
          <Route path="marks" element={isTeachingStaff ? <MarkEntry/> : <Navigate to="/workspace" replace/>}/>
          <Route path="student-access" element={isSchoolAdmin ? <StudentAccess/> : <Navigate to="/workspace" replace/>}/>
          <Route path="results" element={isTeachingStaff ? <Results/> : <Navigate to="/workspace" replace/>}/>
          <Route path="fees" element={isSchoolAdmin ? <FeeTracker/> : <Navigate to="/workspace" replace/>}/>
          <Route path="sms" element={isSchoolAdmin ? <SMS/> : <Navigate to="/workspace" replace/>}/>
          <Route path="settings" element={isSchoolAdmin ? <Settings/> : <Navigate to="/workspace" replace/>}/>
          <Route path="*" element={<Navigate to="/workspace" replace/>}/>
        </Routes>
      </div>
    </main>
  </div>
}

export default function App() {
  return <BrowserRouter><AuthProvider><ToastProvider><Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/s/:slug" element={<SchoolProfile/>}/>
    <Route path="/school-sign-in" element={<SchoolSignIn/>}/>
    <Route path="/register-school" element={<SchoolRegistration/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/reset-password" element={<ResetPassword/>}/>
    <Route path="/platform-admin" element={<PlatformAdmin/>}/>
    <Route path="/workspace/*" element={<ProtectedLayout/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></ToastProvider></AuthProvider></BrowserRouter>
}
