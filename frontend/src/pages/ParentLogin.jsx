import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PinInput } from '../components/index'
import client from '../api/client'

export default function ParentLogin() {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone || pin.length < 6) { addToast('Enter your phone number and full 6-digit PIN', 'warning'); return }
    setLoading(true)
    try {
      const { data: tokenData } = await client.post('/auth/parent-login', { phone, pin })
      const { data: me } = await client.get('/auth/me', { headers: { Authorization: `Bearer ${tokenData.access_token}` } })
      login(tokenData.access_token, me)
      addToast('Welcome! Loading your child\'s data...', 'success')
      navigate('/parent')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Invalid phone or PIN', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold rounded-2xl mb-4 shadow-lg shadow-gold/30">
            <GraduationCap size={32} className="text-navy" />
          </div>
          <h1 className="font-display text-white text-2xl font-bold">Parent Portal</h1>
          <p className="text-white/50 text-sm mt-1">Track your child's progress</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-display text-navy text-lg font-semibold mb-6 text-center">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Phone size={14} /> Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+260 97X XXX XXX"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">6-Digit PIN</label>
              <PinInput value={pin} onChange={setPin} disabled={loading} />
            </div>
            <button
              type="submit"
              disabled={loading || pin.length < 6}
              className="w-full bg-gold text-navy py-3 rounded-xl font-semibold text-sm hover:bg-gold-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
            >
              {loading ? <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> : 'Access My Child\'s Portal'}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-gray-100 text-center space-y-2">
            <p className="text-sm text-gray-500">
              New parent?{' '}
              <Link to="/register/parent" className="text-gold font-medium hover:underline">Register here</Link>
            </p>
            <p className="text-sm text-gray-500">
              <Link to="/login" className="text-navy/60 hover:underline">← Staff Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
