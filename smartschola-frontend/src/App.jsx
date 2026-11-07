import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
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
import ProfileSettings from './pages/ProfileSettings.jsx'
import TeacherManagement from './pages/TeacherManagement.jsx'
import SchoolWebsite from './pages/SchoolWebsite.jsx'
import Admissions from './pages/Admissions.jsx'

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
  '/workspace/settings': 'Workspace settings',
  '/workspace/profile': 'Profile settings',
  '/workspace/teachers': 'Teacher management',
  '/workspace/website': 'School website',
  '/workspace/admissions': 'Admissions & recruitment'
}

function ProtectedLayout() {
  const { isAuthenticated, currentUser } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
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
          <button type="button" className="workspace-topbar-menu" onClick={()=>setMenuOpen(v=>!v)} aria-label="Open workspace menu" aria-expanded={menuOpen}>{menuOpen?<X size={18}/>:<Menu size={18}/>}</button>
          <Link to="/workspace/profile" className="workspace-user-chip" aria-label="Open profile settings">
            <span>{currentUser?.avatar_data?<img src={currentUser.avatar_data} alt=""/>:(currentUser?.full_name || 'U').slice(0,1).toUpperCase()}</span>
            <small>{role || 'Authorised user'}</small>
          </Link>
          <Link to="/" className="workspace-home-link">Public site ↗</Link>
        </div>
        {menuOpen&&<nav className="workspace-header-menu-panel">
          <Link onClick={()=>setMenuOpen(false)} to="/workspace">Dashboard</Link>
          {isSchoolAdmin&&<><Link onClick={()=>setMenuOpen(false)} to="/workspace/students">Students</Link><Link onClick={()=>setMenuOpen(false)} to="/workspace/admissions">Admissions</Link><Link onClick={()=>setMenuOpen(false)} to="/workspace/teachers">Teachers</Link><Link onClick={()=>setMenuOpen(false)} to="/workspace/classes">Classes</Link><Link onClick={()=>setMenuOpen(false)} to="/workspace/website">School website</Link><Link onClick={()=>setMenuOpen(false)} to="/workspace/settings">Settings</Link></>}
          {isTeachingStaff&&<><Link onClick={()=>setMenuOpen(false)} to="/workspace/marks">Marks</Link><Link onClick={()=>setMenuOpen(false)} to="/workspace/results">Results</Link></>}
          <Link onClick={()=>setMenuOpen(false)} to="/workspace/profile">Profile settings</Link>
        </nav>}
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
          <Route path="profile" element={<ProfileSettings/>}/>
          <Route path="teachers" element={isSchoolAdmin ? <TeacherManagement/> : <Navigate to="/workspace" replace/>}/>
          <Route path="website" element={isSchoolAdmin ? <SchoolWebsite/> : <Navigate to="/workspace" replace/>}/>
          <Route path="admissions" element={isSchoolAdmin ? <Admissions/> : <Navigate to="/workspace" replace/>}/>
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
