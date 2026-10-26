import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, GraduationCap, LockKeyhole, ShieldCheck, UserRound, BookOpen, BriefcaseBusiness,  } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import client from '../api/client.js'

const roles = [
  { id: 'headmaster', label: 'Headmaster', icon: BriefcaseBusiness, description: 'Register and manage your school', identityLabel: 'Headmaster email address', identityPlaceholder: 'name@school.edu.zm', autocomplete: 'username' },
  { id: 'teacher', label: 'Teacher', icon: BookOpen, description: 'Classes, marks and learner records', identityLabel: 'Teacher email or staff ID', identityPlaceholder: 'Enter your staff email or ID', autocomplete: 'username' },
  { id: 'student', label: 'Student', icon: GraduationCap, description: 'Learning, results and school updates', identityLabel: 'Student ID', identityPlaceholder: 'Enter the ID given by your teacher', autocomplete: 'username' },
  { id: 'parent', label: 'Parent / Guardian', icon: UserRound, description: 'Your child’s updates and reports', identityLabel: 'Student ID / family ID', identityPlaceholder: 'Enter the ID provided by the school', autocomplete: 'username' },
]

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [role, setRole] = useState('headmaster')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const schoolSlug = searchParams.get('school')
  const selectedRole = roles.find(item => item.id === role) || roles[0]
  const RoleIcon = selectedRole.icon
  const apiConfigured = Boolean(import.meta.env.VITE_API_URL) || !import.meta.env.PROD

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!apiConfigured) {
      setError('School sign-in is not connected yet. Please contact your school administrator. Do not enter real credentials until your school confirms access is available.')
      return
    }
    setLoading(true)
    try {
      const tokenResponse = await client.post('/auth/login', { username: form.username.trim(), password: form.password, role, school_slug: schoolSlug || undefined })
      const accessToken = tokenResponse.data.access_token
      const profileResponse = await client.get('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      const profile = profileResponse.data
      if (profile.role && ![role, role === 'headmaster' ? 'admin' : role, role === 'headmaster' ? 'school_admin' : role].includes(String(profile.role).toLowerCase())) {
        setError('This account does not match the selected sign-in type. Choose the correct role or contact your school administrator.')
        return
      }
      login(accessToken, profile)
      navigate('/workspace', { replace: true })
    } catch (err) {
      if (err.response?.status === 401) setError('Those sign-in details could not be verified. Check them or ask your school administrator for help.')
      else if (err.response?.data?.detail) setError(err.response.data.detail)
      else setError('We could not connect to the sign-in service. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <aside className="login-side-panel">
        <Link to="/" className="login-back-link"><ArrowLeft size={16}/> Back to SmartSchola</Link>
        <div className="login-side-content">
          <span className="login-brand-mark"><GraduationCap size={31}/></span>
          <span className="public-section-kicker">SMARTSCHOLA SCHOOL PORTAL</span>
          <h1>One school.<br/><span>Every role connected.</span></h1>
          <p>A headmaster registers and manages their school. Teachers are authorised by school leadership, and students and parents use school-issued credentials.</p>
          <div className="login-role-points">
            <span><BriefcaseBusiness size={17}/> School leadership</span>
            <span><BookOpen size={17}/> Teaching and learning</span>
            <span><UsersIcon/> Student and family access</span>
          </div>
          <div className="login-assurance"><ShieldCheck size={18}/><span><strong>Your access matters.</strong><small>Private school records should only be available to authorised accounts.</small></span></div>
        </div>
        <div className="login-side-footer">Schools. Families. Futures.</div>
      </aside>
      <main className="login-form-side">
        <div className="login-form-card">
          <Link to="/" className="login-mobile-brand"><span className="public-brand-mark"><GraduationCap size={22}/></span><strong>SmartSchola</strong></Link>
          <span className="public-section-kicker">WELCOME BACK</span>
          <h2>Sign in to your school</h2>
          <p className="login-intro">{schoolSlug ? 'Continue from your selected school profile. Choose your role to see the right sign-in fields.' : 'Choose your role. School leaders register and manage schools; teachers, students and parents sign in with credentials issued by their school.'}</p>
          {schoolSlug && <div className="login-school-context"><GraduationCap size={17}/><span>School profile selected</span><small>{schoolSlug.replaceAll('-', ' ')}</small></div>}
          <div className="login-role-heading"><span>How are you signing in?</span><small>Select your role</small></div>
          <div className="login-role-grid" role="group" aria-label="Choose sign-in role">
            {roles.map(item => { const Icon = item.icon; return <button key={item.id} type="button" className={role === item.id ? 'login-role-option selected' : 'login-role-option'} onClick={() => { setRole(item.id); setError('') }} aria-pressed={role === item.id}><span className="login-role-icon"><Icon size={19}/></span><span className="login-role-copy"><strong>{item.label}</strong><small>{item.description}</small></span><span className="login-role-radio"/></button> })}
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="login-identity">{selectedRole.identityLabel}</label>
            <input id="login-identity" type={role === 'headmaster' || (role === 'teacher' && form.username.includes('@')) ? 'email' : 'text'} autoComplete={selectedRole.autocomplete} required value={form.username} onChange={e => setForm(p => ({...p, username:e.target.value}))} placeholder={selectedRole.identityPlaceholder}/>
            <label htmlFor="login-password">Password</label>
            <div className="login-password-wrap"><input id="login-password" type={showPass ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={e => setForm(p => ({...p,password:e.target.value}))} placeholder="Enter your password"/><button type="button" onClick={() => setShowPass(v=>!v)} aria-label={showPass ? 'Hide password' : 'Show password'}>{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
            {error && <div role="alert" className="login-error"><ShieldCheck size={17}/><span>{error}</span></div>}
            <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Checking your access…' : <><LockKeyhole size={17}/> Continue as {selectedRole.label}</>}</button>
          </form>
          <div className="login-security-note"><ShieldCheck size={17}/><span>Use only the account issued to you by your school. Never share your password with another person.</span></div>
          <p className="login-help">Headmasters: register your school from the SmartSchola home page. Teachers, students and parents: your school must issue your sign-in credentials.</p>
        </div>
      </main>
    </div>
  )
}

function UsersIcon() {
  return <UserRound size={17}/>
}
