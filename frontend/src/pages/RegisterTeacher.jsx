import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, CheckCircle, XCircle, Eye, EyeOff, Check } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

function pwStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-400' }
  if (score <= 3) return { level: 2, label: 'Fair', color: 'bg-yellow-400' }
  return { level: 3, label: 'Strong', color: 'bg-green-500' }
}

export default function RegisterTeacher() {
  const [form, setForm] = useState({ full_name: '', username: '', password: '', confirm: '', phone: '', bio: '' })
  const [showPw, setShowPw] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState(null) // null, 'checking', 'available', 'taken'
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (form.username.length < 4) { setUsernameStatus(null); return }
    const t = setTimeout(async () => {
      setUsernameStatus('checking')
      try {
        const { data } = await client.get(`/register/check-username/${form.username}`)
        setUsernameStatus(data.available ? 'available' : 'taken')
      } catch { setUsernameStatus(null) }
    }, 400)
    return () => clearTimeout(t)
  }, [form.username])

  const strength = pwStrength(form.password)
  const pwMatch = form.password && form.confirm && form.password === form.confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.full_name.length < 3) { addToast('Full name must be at least 3 characters', 'warning'); return }
    if (usernameStatus !== 'available') { addToast('Choose a valid, available username', 'warning'); return }
    if (form.password.length < 8) { addToast('Password must be at least 8 characters', 'warning'); return }
    if (!pwMatch) { addToast('Passwords do not match', 'warning'); return }
    setLoading(true)
    try {
      await client.post('/register/teacher', { full_name: form.full_name, username: form.username, password: form.password, phone: form.phone, bio: form.bio })
      setDone(true)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Registration failed', 'error')
    } finally { setLoading(false) }
  }

  if (done) return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="font-display text-navy text-2xl font-bold mb-2">Registration Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">Your account is pending admin approval. You'll be able to log in once approved. Check back in 24 hours or contact your school administrator.</p>
        <Link to="/login" className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all">← Back to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="w-full max-w-4xl fade-in">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          {/* Left panel */}
          <div className="bg-navy lg:w-2/5 p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center"><GraduationCap size={20} className="text-navy" /></div>
                <span className="font-display text-white text-lg font-bold">Smart Schola</span>
              </div>
              <h2 className="font-display text-white text-2xl font-bold mb-3">Teacher Registration</h2>
              <p className="text-white/60 text-sm mb-8">Join your school's Smart Schola platform. Your account will be active after admin approval.</p>
              <div className="space-y-3">
                {['ECZ-aligned grade computation','PDF report slip generation','Class & subject management','Real-time mark entry','Parent communication via SMS'].map(b => (
                  <div key={b} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0"><Check size={11} className="text-gold" /></div>
                    <span className="text-white/70 text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-white/30 text-xs mt-8">Already registered? <Link to="/login" className="text-gold hover:underline">Sign in here</Link></p>
          </div>

          {/* Right panel */}
          <div className="flex-1 p-8 overflow-y-auto">
            <h3 className="font-display text-navy text-xl font-semibold mb-6">Create Your Account</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Mr. John Banda" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Username *</label>
                  <div className="relative">
                    <input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')}))} placeholder="jbanda" className="w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                    <div className="absolute right-3 top-3">
                      {usernameStatus === 'available' && <CheckCircle size={14} className="text-green-500" />}
                      {usernameStatus === 'taken' && <XCircle size={14} className="text-red-500" />}
                      {usernameStatus === 'checking' && <div className="w-3.5 h-3.5 border border-gray-300 border-t-navy rounded-full animate-spin" />}
                    </div>
                  </div>
                  {usernameStatus === 'taken' && <p className="text-red-500 text-xs mt-1">Username is taken</p>}
                  {usernameStatus === 'available' && <p className="text-green-600 text-xs mt-1">Username is available!</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password *</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min. 8 characters" className="w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3 text-gray-400">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {form.password && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} transition-all`} style={{width: `${(strength.level/3)*100}%`}} />
                      </div>
                      <span className={`text-xs font-medium ${strength.level===3?'text-green-600':strength.level===2?'text-yellow-600':'text-red-500'}`}>{strength.label}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm Password *</label>
                  <div className="relative">
                    <input type="password" value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} placeholder="Repeat password" className="w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                    {form.confirm && <div className="absolute right-3 top-3">{pwMatch ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-400" />}</div>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone (optional)</label>
                <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+260 97X XXX XXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Note to Admin (optional)</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={3} placeholder="Briefly describe your teaching experience, subjects, and grades..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-navy text-white py-3 rounded-xl font-medium text-sm hover:bg-navy-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Registration'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
