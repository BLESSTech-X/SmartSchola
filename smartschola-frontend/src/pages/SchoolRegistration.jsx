import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react'
import { apiRequest, apiConfigured } from '../lib/api.js'

const slugify = value => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function SchoolRegistration() {
  const [form, setForm] = useState({ schoolName: '', location: '', fullName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')


  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!apiConfigured) {
      setError('School registration is temporarily unavailable because the SmartSchola API is not configured.')
      return
    }
    if (form.password.length < 10) {
      setError('Use a password with at least 10 characters.')
      return
    }
    const slug = slugify(form.schoolName)
    if (!slug) {
      setError('Enter a valid school name.')
      return
    }
    setLoading(true)
    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        token: '',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          full_name: form.fullName.trim(),
          school_name: form.schoolName.trim(),
          school_slug: slug,
          school_location: form.location.trim(),
        }),
      })
      setMessage('Your headmaster account and school registration have been submitted. The school is pending verification and will appear in the public directory only after approval.')
      setForm({ schoolName: '', location: '', fullName: '', email: '', password: '' })
    } catch (err) {
      setError(err.message || 'We could not complete registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="school-signin-page">
    <header className="school-signin-topbar">
      <Link to="/" className="public-brand"><span className="public-brand-mark"><GraduationCap size={24}/></span><span><strong>SmartSchola</strong><small>Schools. Families. Futures.</small></span></Link>
      <Link to="/" className="school-signin-back"><ArrowLeft size={16}/> Back to home</Link>
    </header>
    <section className="school-signin-content">
      <div className="school-signin-heading">
        <span className="public-section-kicker"><ShieldCheck size={15}/> SCHOOL LEADERSHIP REGISTRATION</span>
        <h1>Bring your school <span>to SmartSchola.</span></h1>
        <p>Register a school using the headmaster's account. Every request is reviewed before the school becomes visible in the public directory.</p>
      </div>
      <form className="school-registration-form" onSubmit={handleSubmit}>
        <label>School name<input required minLength={2} maxLength={180} value={form.schoolName} onChange={e => setForm(v => ({ ...v, schoolName: e.target.value }))} placeholder="e.g. Example Academy"/></label>
        <label>School location<input value={form.location} onChange={e => setForm(v => ({ ...v, location: e.target.value }))} placeholder="Town, district or province"/></label>
        <div className="school-registration-divider">HEADMASTER ACCOUNT</div>
        <label>Headmaster's full name<input required value={form.fullName} onChange={e => setForm(v => ({ ...v, fullName: e.target.value }))} placeholder="Your full name"/></label>
        <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} placeholder="you@example.com"/></label>
        <label>Create password<input required type="password" minLength={10} autoComplete="new-password" value={form.password} onChange={e => setForm(v => ({ ...v, password: e.target.value }))} placeholder="At least 10 characters"/></label>
        {error && <p className="school-registration-message error" role="alert">{error}</p>}
        {message && <p className="school-registration-message success" role="status">{message}</p>}
        <button className="school-signin-continue school-registration-submit" type="submit" disabled={loading}>{loading ? 'Submitting securely…' : <>Create headmaster account & register school <ArrowRight size={17}/></>}</button>
        <p className="school-registration-footnote">Registration creates a pending school request and an initial headmaster account. Verification is required before public listing. Do not register a school you are not authorised to represent.</p>
      </form>
    </section>
    <footer className="school-signin-footer">© {new Date().getFullYear()} SmartSchola · Schools. Families. Futures.</footer>
  </main>
}
