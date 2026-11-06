import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, LockKeyhole, ShieldCheck } from 'lucide-react'
import { apiRequest } from '../lib/api.js'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (password.length < 10) return setError('Use at least 10 characters for your new password.')
    if (password !== confirm) return setError('The passwords do not match.')
    setBusy(true)
    try {
      const token = searchParams.get('token')
      if (!token) throw new Error('This password setup link is missing its security token. Ask your school administrator for a new link.')
      await apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
      setSuccess('Your password has been updated.')
      setPassword('')
      setConfirm('')
      window.setTimeout(() => navigate('/school-sign-in', { replace: true }), 1800)
    } catch (err) {
      setError(err.message || 'This secure link could not be used. Ask your school administrator for a new one-time setup link.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="login-page reset-password-page"><section className="login-form-side"><div className="login-form-card">
    <Link to="/" className="login-mobile-brand"><span className="public-brand-mark"><GraduationCap size={22}/></span><strong>SmartSchola</strong></Link>
    <span className="public-section-kicker">SECURE ACCOUNT SETUP</span><h2>Create or update your password</h2>
    <p className="login-intro">Use the secure, one-time password setup link provided by your school administrator.</p>
    
    <form onSubmit={submit}>
      <label htmlFor="new-password">New password</label><input id="new-password" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={10} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 10 characters"/>
      <label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type={show ? 'text' : 'password'} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Enter it again"/>
      <label className="reset-show-password"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)}/> Show password</label>
      {error && <div role="alert" className="login-error"><ShieldCheck size={17}/><span>{error}</span></div>}
      {success && <div role="status" className="login-security-note"><ShieldCheck size={17}/><span>{success} Returning to school selection…</span></div>}
      <button className="login-submit" type="submit" disabled={busy}>{busy ? 'Updating securely…' : <><LockKeyhole size={17}/> Update password</>}</button>
    </form>
    <p className="login-help">Never share your password. If your invitation has expired, ask your school administrator to send a new one.</p>
    <Link to="/school-sign-in" className="school-signin-back">Return to school selection</Link>
  </div></section></main>
}
