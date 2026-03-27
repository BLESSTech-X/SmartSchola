import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import client from '../api/client.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username || !form.password) { setError('Please enter username and password'); return }
    setLoading(true)
    try {
      const { data } = await client.post('/auth/login', form)
      login(data.access_token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 page-enter">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#0B1D3A' }}>
            <GraduationCap size={32} style={{ color: '#F5A623' }} />
          </div>
          <h1 className="font-display font-bold text-3xl" style={{ color: '#0B1D3A' }}>Smart Schola</h1>
          <p className="text-gray-400 text-sm mt-1">Empowering Zambian Schools</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="Enter your username"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ focusRingColor: '#F5A623' }}
              onFocus={e => e.target.style.borderColor = '#F5A623'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all pr-11"
                onFocus={e => e.target.style.borderColor = '#F5A623'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-70 mt-2"
            style={{ background: '#0B1D3A' }}
          >
            {loading ? <><LoadingSpinner size={18} color="white" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-300 mt-6">Smart Schola v1.0 · Zambia</p>
      </div>
    </div>
  )
}
