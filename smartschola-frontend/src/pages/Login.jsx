import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const DEMO_EMAIL = 'admin@smartschola.zm'
const DEMO_PASSWORD = 'SmartSchola2026!'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password) {
      setError('Enter the demo administrator email and password.')
      return
    }
    setLoading(true)
    // Intentionally local-only: temporary demonstration login, no API/database call.
    window.setTimeout(() => {
      if (form.username.trim().toLowerCase() === DEMO_EMAIL && form.password === DEMO_PASSWORD) {
        login('smartschola-demo-session', {
          id: 'demo-admin',
          email: DEMO_EMAIL,
          name: 'SmartSchola Demo Administrator',
          full_name: 'SmartSchola Demo Administrator',
          role: 'admin',
          is_demo: true,
        })
        navigate('/', { replace: true })
      } else {
        setError('Incorrect demo login details. Use the credentials shown below.')
      }
      setLoading(false)
    }, 250)
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 sm:p-8 page-enter">
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#0B1D3A' }}>
            <GraduationCap size={32} style={{ color: '#F5A623' }} />
          </div>
          <h1 className="font-display font-bold text-3xl" style={{ color: '#0B1D3A' }}>SmartSchola</h1>
          <p className="text-gray-500 text-sm mt-1">School Management · Zambia</p>
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck size={14} /> DEMO ACCESS · FICTIONAL DATA ONLY
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1.5">Administrator email</label>
            <input id="email" type="email" autoComplete="username" required value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="admin@smartschola.zm"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
            <div className="relative">
              <input id="password" type={showPass ? 'text' : 'password'} autoComplete="current-password" required value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Enter demo password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 pr-12"
              />
              <button type="button" aria-label={showPass ? 'Hide password' : 'Show password'} onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 p-1">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: '#0B1D3A' }}>
            {loading ? 'Opening demo…' : 'Sign in to SmartSchola'}
          </button>
        </form>

        <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold tracking-wide text-slate-600 mb-2">DEMO LOGIN DETAILS</p>
          <p className="text-sm text-slate-700"><span className="font-medium">Email:</span> admin@smartschola.zm</p>
          <p className="text-sm text-slate-700 mt-1"><span className="font-medium">Password:</span> SmartSchola2026!</p>
        </div>
        <p className="text-center text-xs text-slate-400 mt-5">Temporary demonstration access. Do not enter real student or financial information.</p>
      </div>
    </div>
  )
}
