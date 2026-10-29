import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, GraduationCap, LockKeyhole, ShieldCheck, UserRound, BookOpen, BriefcaseBusiness } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const roles = [
  { id: 'headmaster', label: 'Headmaster', icon: BriefcaseBusiness, description: 'School leadership and management', identityLabel: 'Headmaster email address', identityPlaceholder: 'name@school.edu.zm', autocomplete: 'username' },
  { id: 'teacher', label: 'Teacher', icon: BookOpen, description: 'Classes, marks and learner records', identityLabel: 'School account email address', identityPlaceholder: 'Enter the email registered with your school', autocomplete: 'username' },
  { id: 'student', label: 'Student', icon: GraduationCap, description: 'Learning, results and school updates', identityLabel: 'Student account email address', identityPlaceholder: 'Enter the email registered with your school', autocomplete: 'username' },
  { id: 'parent', label: 'Parent / Guardian', icon: UserRound, description: 'Your child’s updates and reports', identityLabel: 'Parent / guardian account email', identityPlaceholder: 'Enter the email registered with your school', autocomplete: 'username' },
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
  const apiConfigured = isSupabaseConfigured

  useEffect(() => {
    if (!schoolSlug) return
    let active = true
    if (!isSupabaseConfigured) {
      setSchoolLoading(false)
      return () => { active = false }
    }
    supabase.from('schools').select('id,name,slug,location').eq('slug', schoolSlug).eq('status', 'verified').maybeSingle()
      .then(({ data, error }) => { if (active) setSchool(error ? null : data) })
      .catch(() => { if (active) setSchool(null) })
      .finally(() => { if (active) setSchoolLoading(false) })
    return () => { active = false }
  }, [schoolSlug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!schoolSlug || !school) {
      setError('This school is not in the verified school directory. Return to the school list and select a verified school.')
      return
    }
    if (!apiConfigured) {
      setError('Supabase sign-in is not configured. Please contact SmartSchola support.')
      return
    }
    if (!form.username.includes('@')) {
      setError('Use the email address registered to your school account. School-issued ID sign-in will be added through a secure account-linking process.')
      return
    }
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: form.username.trim(), password: form.password })
      if (authError) throw authError
      const { data: membership, error: membershipError } = await supabase.from('school_memberships')
        .select('id,school_id,role,status').eq('school_id', school.id).eq('user_id', authData.user.id).eq('status', 'active').maybeSingle()
      if (membershipError) throw membershipError
      if (!membership || membership.role !== role) {
        await supabase.auth.signOut()
        setError('This account does not have an active ' + selectedRole.label.toLowerCase() + ' membership at ' + school.name + '. Contact your school headmaster.')
        return
      }
      const { data: profile, error: profileError } = await supabase.from('profiles')
        .select('full_name,phone').eq('id', authData.user.id).maybeSingle()
      if (profileError) throw profileError
      const userProfile = { id: authData.user.id, full_name: profile?.full_name || authData.user.email, email: authData.user.email,
        phone: profile?.phone || '', school_id: school.id, school_slug: school.slug, school_name: school.name, role: membership.role }
      login(authData.session.access_token, userProfile)
      navigate('/workspace', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check your email and password, then try again.')
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
          <div className="login-assurance"><ShieldCheck size={18}/><span><strong>School account protection.</strong><small>Your school role and active membership are checked before workspace access is granted.</small></span></div>
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
            <input id="login-identity" type="email" autoComplete={selectedRole.autocomplete} required value={form.username} onChange={e => setForm(p => ({...p, username:e.target.value}))} placeholder={selectedRole.identityPlaceholder}/>
            <label htmlFor="login-password">Password</label>
            <div className="login-password-wrap"><input id="login-password" type={showPass ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={e => setForm(p => ({...p,password:e.target.value}))} placeholder="Enter your password"/><button type="button" onClick={() => setShowPass(v=>!v)} aria-label={showPass ? 'Hide password' : 'Show password'}>{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
            {error && <div role="alert" className="login-error"><ShieldCheck size={17}/><span>{error}</span></div>}
            <button className="login-submit" type="submit" disabled={loading || schoolLoading || !school}>{loading ? 'Checking your school access…' : <><LockKeyhole size={17}/> Continue as {selectedRole.label}</>}</button>
          </form>
          <div className="login-security-note"><ShieldCheck size={17}/><span>Only your selected school's authorised accounts can sign in here. Your school membership is checked before workspace access is granted.</span></div>
          <p className="login-help">If you cannot access your account, contact your school headmaster for assistance. Never share your password with another person.</p>
        </div>
      </main>
    </div>
  )
}
