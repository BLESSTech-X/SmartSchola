import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { GraduationCap, LockKeyhole, ShieldCheck } from 'lucide-react'
import client from '../api/client.js'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const token = params.get('token') || ''

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (password.length < 10) return setError('Use at least 10 characters for your new password.')
    if (password !== confirm) return setError('The passwords do not match.')
    setBusy(true)
    try {
      const { data } = await client.post('/auth/password-reset', { token, new_password: password })
      setSuccess(data.message || 'Your password has been updated.')
      setPassword('')
      setConfirm('')
      window.setTimeout(() => navigate('/school-sign-in', { replace: true }), 1800)
    } catch (err) {
      setError(err.response?.data?.detail || 'This reset link could not be used. Contact SmartSchola support.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="login-page reset-password-page"><section className="login-form-side"><div className="login-form-card">
    <Link to="/" className="login-mobile-brand"><span className="public-brand-mark"><GraduationCap size={22}/></span><strong>SmartSchola</strong></Link>
    <span className="public-section-kicker">SECURE ACCOUNT RECOVERY</span><h2>Update your login information</h2>
    <p className="login-intro">Use the one-time reset link sent by SmartSchola support after your school access has been verified.</p>
    {!token && <div role="alert" className="login-error"><ShieldCheck size={17}/><span>The reset token is missing. Please use the full link from your email.</span></div>}
    <form onSubmit={submit}>
      <label htmlFor="new-password">New password</label><input id="new-password" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={10} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 10 characters"/>
      <label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type={show ? 'text' : 'password'} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Enter it again"/>
      <label className="reset-show-password"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)}/> Show password</label>
      {error && <div role="alert" className="login-error"><ShieldCheck size={17}/><span>{error}</span></div>}
      {success && <div role="status" className="login-security-note"><ShieldCheck size={17}/><span>{success} Returning to school selection…</span></div>}
      <button className="login-submit" type="submit" disabled={busy || !token}>{busy ? 'Updating securely…' : <><LockKeyhole size={17}/> Update password</>}</button>
    </form>
    <p className="login-help">Reset links expire after 30 minutes and can only be used once. If the link has expired, contact SmartSchola support.</p>
    <Link to="/school-sign-in" className="school-signin-back">Return to school selection</Link>
  </div></section></main>
}
