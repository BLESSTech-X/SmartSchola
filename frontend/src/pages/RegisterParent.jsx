import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Search, CheckCircle, XCircle, Check, User, Phone, Lock } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { PinInput } from '../components/index'
import client from '../api/client'

export default function RegisterParent() {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '', relationship: 'Mother' })
  const [phoneStatus, setPhoneStatus] = useState(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (search.length < 2) { setStudents([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await client.get(`/students?search=${search}&per_page=5`)
        setStudents(data.students || [])
      } catch { setStudents([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (form.phone.length < 10) { setPhoneStatus(null); return }
    const t = setTimeout(async () => {
      setPhoneStatus('checking')
      try {
        const { data } = await client.get(`/register/check-phone/${encodeURIComponent(form.phone)}`)
        setPhoneStatus(data.available ? 'available' : 'taken')
      } catch { setPhoneStatus(null) }
    }, 400)
    return () => clearTimeout(t)
  }, [form.phone])

  const handleSubmit = async () => {
    if (pin !== confirmPin) { addToast('PINs do not match', 'warning'); return }
    if (pin.length !== 6) { addToast('PIN must be exactly 6 digits', 'warning'); return }
    setLoading(true)
    try {
      await client.post('/register/parent', {
        full_name: form.full_name,
        phone: form.phone,
        student_id: selectedStudent.id,
        relationship_to_student: form.relationship,
        pin,
      })
      setDone(true)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Registration failed', 'error')
    } finally { setLoading(false) }
  }

  if (done) return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32} className="text-green-600" /></div>
        <h2 className="font-display text-navy text-2xl font-bold mb-2">Registration Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">Your parent account is pending admin approval. Once approved, log in using your phone number and the PIN you set.</p>
        <Link to="/parent-login" className="inline-flex items-center gap-2 bg-gold text-navy px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gold-600 transition-all">Go to Parent Login →</Link>
      </div>
    </div>
  )

  const steps = [
    { num: 1, label: 'Find Child', icon: <Search size={14} /> },
    { num: 2, label: 'Your Details', icon: <User size={14} /> },
    { num: 3, label: 'Set PIN', icon: <Lock size={14} /> },
  ]

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white mb-2">
            <GraduationCap size={24} className="text-gold" />
            <span className="font-display text-xl font-bold">Smart Schola</span>
          </div>
          <p className="text-white/50 text-sm">Parent Registration</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${step >= s.num ? 'bg-gold text-navy' : 'bg-white/10 text-white/40'}`}>
                {s.icon}<span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-gold' : 'bg-white/20'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h3 className="font-display text-navy text-lg font-semibold mb-1">Find Your Child</h3>
              <p className="text-gray-500 text-sm mb-5">Search by name to link your account to your child's record.</p>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Type student name..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {students.map(s => (
                  <button key={s.id} onClick={() => setSelectedStudent(s)} className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${selectedStudent?.id === s.id ? 'border-gold bg-gold/5' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-navy text-sm">{s.first_name} {s.last_name}</p>
                        <p className="text-gray-500 text-xs">Grade {s.grade} · Class {s.class_name}</p>
                      </div>
                      {selectedStudent?.id === s.id && <CheckCircle size={18} className="text-gold" />}
                    </div>
                  </button>
                ))}
                {search.length >= 2 && students.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No students found. Try a different name.</p>}
              </div>
              <button onClick={() => setStep(2)} disabled={!selectedStudent} className="w-full bg-navy text-white py-3 rounded-xl font-medium text-sm mt-5 disabled:opacity-40 hover:bg-navy-400 transition-all">
                Next: Your Details →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h3 className="font-display text-navy text-lg font-semibold mb-1">Your Details</h3>
              <p className="text-gray-500 text-sm mb-1">Registering for: <strong>{selectedStudent?.first_name} {selectedStudent?.last_name}</strong></p>
              <p className="text-gray-400 text-xs mb-5">Grade {selectedStudent?.grade} · {selectedStudent?.class_name}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Mrs. Chanda Bwalya" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone Number * (used to log in)</label>
                  <div className="relative">
                    <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+260 97X XXX XXX" className="w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                    <div className="absolute right-3 top-3">
                      {phoneStatus === 'available' && <CheckCircle size={14} className="text-green-500" />}
                      {phoneStatus === 'taken' && <XCircle size={14} className="text-red-500" />}
                      {phoneStatus === 'checking' && <div className="w-3.5 h-3.5 border border-gray-300 border-t-navy rounded-full animate-spin" />}
                    </div>
                  </div>
                  {phoneStatus === 'taken' && <p className="text-red-500 text-xs mt-1">This phone is already registered</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Relationship to Student *</label>
                  <select value={form.relationship} onChange={e => setForm(f => ({...f, relationship: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold">
                    {['Mother','Father','Guardian','Other'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-all">← Back</button>
                <button onClick={() => setStep(3)} disabled={!form.full_name || phoneStatus !== 'available'} className="flex-2 flex-1 bg-navy text-white py-3 rounded-xl font-medium text-sm disabled:opacity-40 hover:bg-navy-400 transition-all">Next: Set PIN →</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h3 className="font-display text-navy text-lg font-semibold mb-1">Set Your PIN</h3>
              <p className="text-gray-500 text-sm mb-6">Choose a 6-digit PIN you'll use to log in every time.</p>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 text-center">Create PIN</p>
                  <PinInput value={pin} onChange={setPin} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 text-center">Confirm PIN</p>
                  <PinInput value={confirmPin} onChange={setConfirmPin} />
                  {pin.length === 6 && confirmPin.length === 6 && (
                    <p className={`text-xs text-center mt-2 font-medium ${pin === confirmPin ? 'text-green-600' : 'text-red-500'}`}>
                      {pin === confirmPin ? '✓ PINs match' : '✗ PINs do not match'}
                    </p>
                  )}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <strong>Keep your PIN private.</strong> Do not share it with anyone. Your PIN is the only credential used to access your child's data.
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-all">← Back</button>
                <button onClick={handleSubmit} disabled={loading || pin.length < 6 || pin !== confirmPin} className="flex-1 bg-gold text-navy py-3 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-gold-600 transition-all flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> : 'Submit Registration'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
