import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, GraduationCap, LockKeyhole, ShieldCheck, UserRound, BookOpen, BriefcaseBusiness } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import client from '../api/client.js'

const roles = [
  { id: 'headmaster', label: 'Headmaster', icon: BriefcaseBusiness, description: 'School leadership and management', identityLabel: 'Headmaster email address', identityPlaceholder: 'name@school.edu.zm', autocomplete: 'username' },
  { id: 'teacher', label: 'Teacher', icon: BookOpen, description: 'Classes, marks and learner records', identityLabel: 'School-issued staff ID or email', identityPlaceholder: 'Enter your authorised staff ID or email', autocomplete: 'username' },
  { id: 'student', label: 'Student', icon: GraduationCap, description: 'Learning, results and school updates', identityLabel: 'School-issued student ID', identityPlaceholder: 'Enter the ID given by your school', autocomplete: 'username' },
  { id: 'parent', label: 'Parent / Guardian', icon: UserRound, description: 'Your child’s updates and reports', identityLabel: 'School-issued family ID or email', identityPlaceholder: 'Enter the ID provided by your school', autocomplete: 'username' },
]

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [role, setRole] = useState('headmaster')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [school, setSchool] = useState(null)
  const [schoolLoading, setSchoolLoading] = useState(true)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const schoolSlug = searchParams.get('school')
  const selectedRole = roles.find(item => item.id === role) || roles[0]
  const RoleIcon = selectedRole.icon
  const apiConfigured = Boolean(import.meta.env.VITE_API_URL) || !import.meta.env.PROD

  useEffect(() => {
    if (!schoolSlug) return
    let active = true
    client.get('/schools/public')
      .then(({ data }) => {
        const found = Array.isArray(data) ? data.find(item => item.slug === schoolSlug) : null
        if (active) setSchool(found || null)
      })
      .catch(() => { if (active) setSchool(null) })
      .finally(() => { if (active) setSchoolLoading(false) })
    return () => { active = false }
  }, [schoolSlug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!schoolSlug || !school) {
      setError('This school is not in the active school directory. Return to the school list and select a registered school.')
      return
    }
    if (!apiConfigured) {
      setError('School sign-in is not connected yet. Please contact SmartSchola support. Do not enter real credentials until access is confirmed.')
      return
    }
    setLoading(true)
    try {
      const tokenResponse = await client.post('/auth/login', { username: form.username.trim(), password: form.password, role, school_slug: schoolSlug })
      const accessToken = tokenResponse.data.access_token
      const profileResponse = await client.get('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      const profile = { ...profileResponse.data, school_id: school.id, school_slug: school.slug, school_name: school.name, role }
      login(accessToken, profile)
      navigate('/workspace', { replace: true })
    } catch (err) {
      if (err.response?.status === 423) setError(err.response.data?.detail || 'This school sign-in has been flagged after three failed attempts. Contact SmartSchola support for verification with your headmaster.')
      else if (err.response?.status === 401) setError(err.response.data?.detail || `Sign-in failed for ${school.name}. Check your school-issued credentials.`)
      else if (err.response?.data?.detail) setError(err.response.data.detail)
      else setError('We could not connect to the sign-in service. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (!schoolSlug) return <Navigate to="/school-sign-in" replace />

  return (
    <div className="login-page">
      <aside className="login-side-panel">
        <Link to="/school-sign-in" className="login-back-link"><ArrowLeft size={16}/> Change school</Link>
        <div className="login-side-content">
          <span className="login-brand-mark"><GraduationCap size={31}/></span>
          <span className="public-section-kicker">SMARTSCHOLA SCHOOL PORTAL</span>
          <h1>One school.<br/><span>Every role connected.</span></h1>
          <p>Access is checked against this school and your authorised school membership. Selecting a role does not grant permission.</p>
          <div className="login-role-points">
            <span><BriefcaseBusiness size={17}/> School leadership</span>
            <span><BookOpen size={17}/> Teaching and learning</span>
            <span><UserRound size={17}/> Student and family access</span>
          </div>
          <div className="login-assurance"><ShieldCheck size={18}/><span><strong>Three-attempt protection.</strong><small>After three failed attempts, contact support. We verify with the headmaster before restoring access.</small></span></div>
        </div>
        <div className="login-side-footer">Schools. Families. Futures.</div>
      </aside>
      <main className="login-form-side">
        <div className="login-form-card">
          <Link to="/" className="login-mobile-brand"><span className="public-brand-mark"><GraduationCap size={22}/></span><strong>SmartSchola</strong></Link>
          <span className="public-section-kicker">WELCOME BACK</span>
          <h2>Sign in to your school</h2>
          <p className="login-intro">Enter the credentials issued to you by the selected school. Your account must be explicitly authorised by that school's leadership.</p>
          <div className="login-school-context"><GraduationCap size={17}/><span>Signing in to</span><small>{schoolLoading ? 'Verifying registered school…' : school?.name || 'School not recognised'}</small>{!schoolLoading && school && <Link to="/school-sign-in">Change</Link>}</div>
          {!schoolLoading && !school && <div role="alert" className="login-error"><ShieldCheck size={17}/><span>This school is not registered or active. Return to the school list and choose a registered school.</span></div>}
          <div className="login-role-heading"><span>How are you signing in?</span><small>Select your role</small></div>
          <div className="login-role-grid" role="group" aria-label="Choose sign-in role">
            {roles.map(item => { const Icon = item.icon; return <button key={item.id} type="button" className={role === item.id ? 'login-role-option selected' : 'login-role-option'} onClick={() => { setRole(item.id); setError('') }} aria-pressed={role === item.id}><span className="login-role-icon"><Icon size={19}/></span><span className="login-role-copy"><strong>{item.label}</strong><small>{item.description}</small></span><span className="login-role-radio"/></button> })}
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="login-identity">{selectedRole.identityLabel}</label>
            <input id="login-identity" type={role === 'headmaster' || (role === 'teacher' && form.username.includes('@')) || (role === 'parent' && form.username.includes('@')) ? 'email' : 'text'} autoComplete={selectedRole.autocomplete} required value={form.username} onChange={e => setForm(p => ({...p, username:e.target.value}))} placeholder={selectedRole.identityPlaceholder}/>
            <label htmlFor="login-password">Password</label>
            <div className="login-password-wrap"><input id="login-password" type={showPass ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={e => setForm(p => ({...p,password:e.target.value}))} placeholder="Enter your password"/><button type="button" onClick={() => setShowPass(v=>!v)} aria-label={showPass ? 'Hide password' : 'Show password'}>{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
            {error && <div role="alert" className="login-error"><ShieldCheck size={17}/><span>{error}</span></div>}
            <button className="login-submit" type="submit" disabled={loading || schoolLoading || !school}>{loading ? 'Checking your school access…' : <><LockKeyhole size={17}/> Continue as {selectedRole.label}</>}</button>
          </form>
          <div className="login-security-note"><ShieldCheck size={17}/><span>Only your selected school's authorised accounts can sign in here. Three failed attempts flag this school-specific sign-in for verification.</span></div>
          <p className="login-help">If you are flagged, contact SmartSchola support. We will verify your identity with the headmaster before any reset. Any applicable support fee must be explained before payment; never pay an unverified person.</p>
        </div>
      </main>
    </div>
  )
}
