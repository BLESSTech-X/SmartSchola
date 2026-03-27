import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { addToast('Please fill in all fields', 'warning'); return }
    setLoading(true)
    try {
      const { data: tokenData } = await client.post('/auth/login', form)
      client.defaults.headers.Authorization = `Bearer ${tokenData.access_token}`
      const { data: me } = await client.get('/auth/me', { headers: { Authorization: `Bearer ${tokenData.access_token}` } })
      login(tokenData.access_token, me)
      addToast(`Welcome back, ${me.full_name}!`, 'success')
      navigate('/dashboard')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Login failed. Check your credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold rounded-2xl mb-4 shadow-lg shadow-gold/30">
            <GraduationCap size={32} className="text-navy" />
          </div>
          <h1 className="font-display text-white text-3xl font-bold">Smart Schola</h1>
          <p className="text-white/50 text-sm mt-1">School Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-display text-navy text-xl font-semibold mb-6">Staff Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white py-3 rounded-xl font-medium text-sm hover:bg-navy-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-center">
            <p className="text-sm text-gray-500">
              Parent?{' '}
              <Link to="/parent-login" className="text-gold font-medium hover:underline">Access Parent Portal</Link>
            </p>
            <p className="text-sm text-gray-500">
              New teacher?{' '}
              <Link to="/register/teacher" className="text-navy font-medium hover:underline">Register here</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          BlesstechX · Smart Schola ProMax v1.0
        </p>
      </div>
    </div>
  )
}
