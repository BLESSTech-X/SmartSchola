import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, GraduationCap, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import client from '../api/client.js'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const schoolSlug = searchParams.get('school')
  const apiConfigured = Boolean(import.meta.env.VITE_API_URL) || !import.meta.env.PROD

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!apiConfigured) {
      setError('School sign-in is being connected. Please contact SmartSchola support; do not enter real school credentials here yet.')
      return
    }
    setLoading(true)
    try {
      const tokenResponse = await client.post('/auth/login', form)
      const accessToken = tokenResponse.data.access_token
      const profileResponse = await client.get('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      login(accessToken, profileResponse.data)
      navigate('/workspace', { replace: true })
    } catch (err) {
      if (err.response?.status === 401) setError('The email or password is incorrect.')
      else if (err.response?.data?.detail) setError(err.response.data.detail)
      else setError('We could not connect to the sign-in service. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-side-panel">
        <Link to="/" className="login-back-link"><ArrowLeft size={16}/> Back to SmartSchola</Link>
        <div className="login-side-content"><span className="login-brand-mark"><GraduationCap size={31}/></span><span className="public-section-kicker">SMARTSCHOLA SCHOOL PORTAL</span><h1>Your school.<br/><span>Your connected workspace.</span></h1><p>Secure access for authorised school teams. Your role and school membership determine the tools and records available to you.</p><div className="login-assurance"><ShieldCheck size={18}/><span><strong>School data deserves care.</strong><small>Access should be verified and permission-based.</small></span></div></div>
        <div className="login-side-footer">Schools. Families. Futures.</div>
      </div>
      <main className="login-form-side">
        <div className="login-form-card">
          <Link to="/" className="login-mobile-brand"><span className="public-brand-mark"><GraduationCap size={22}/></span><strong>SmartSchola</strong></Link>
          <span className="public-section-kicker">WELCOME BACK</span>
          <h2>Sign in to your school</h2>
          <p className="login-intro">{schoolSlug ? 'Continue from your selected school profile. Your access will be checked securely.' : 'Enter the account details provided by your school administrator.'}</p>
          {schoolSlug && <div className="login-school-context"><GraduationCap size={17}/><span>School profile selected</span><small>{schoolSlug.replaceAll('-', ' ')}</small></div>}
          <form onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>
            <input id="login-email" type="email" autoComplete="username" required value={form.username} onChange={e => setForm(p => ({...p, username:e.target.value}))} placeholder="you@school.edu.zm"/>
            <label htmlFor="login-password">Password</label>
            <div className="login-password-wrap"><input id="login-password" type={showPass ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={e => setForm(p => ({...p,password:e.target.value}))} placeholder="Enter your password"/><button type="button" onClick={() => setShowPass(v=>!v)} aria-label={showPass ? 'Hide password' : 'Show password'}>{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
            {error && <div role="alert" className="login-error"><ShieldCheck size={17}/><span>{error}</span></div>}
            <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : <><LockKeyhole size={17}/> Sign in securely</>}</button>
          </form>
          <div className="login-security-note"><ShieldCheck size={17}/><span>Use only the account issued to you by your school. SmartSchola will never ask you to share your password with another person.</span></div>
          <p className="login-help">Need access? Ask your school administrator to issue or reset your account.</p>
        </div>
      </main>
    </div>
  )
}
