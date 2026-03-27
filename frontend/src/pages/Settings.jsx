import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, School, MessageSquare, BookOpen, Lock, Plus, Trash2, Eye, EyeOff, Save } from 'lucide-react'
import { LoadingSpinner } from '../components/index'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import client, { API_URL } from '../api/client'

export default function Settings() {
  const [school, setSchool] = useState({ name: '', address: '', headmaster: '', phone: '', email: '', sms_provider: 'africas_talking', sms_api_key: '', sms_username: '', sms_sender_id: '' })
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState({ name: '', code: '' })
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' })
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const { addToast } = useToast()
  const { currentUser } = useAuth()

  useEffect(() => {
    Promise.all([client.get('/settings'), client.get('/subjects')]).then(([s, sub]) => {
      if (s.data) setSchool(s.data)
      setSubjects(sub.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const saveSchool = async () => {
    setSaving(s => ({...s, school: true}))
    try {
      await client.put('/settings', { name: school.name, address: school.address, headmaster: school.headmaster, phone: school.phone, email: school.email })
      addToast('School information saved', 'success')
    } catch { addToast('Failed to save', 'error') } finally { setSaving(s => ({...s, school: false})) }
  }

  const saveSMS = async () => {
    setSaving(s => ({...s, sms: true}))
    try {
      await client.put('/settings', { sms_provider: school.sms_provider, sms_api_key: school.sms_api_key, sms_username: school.sms_username, sms_sender_id: school.sms_sender_id })
      addToast('SMS settings saved', 'success')
    } catch { addToast('Failed to save', 'error') } finally { setSaving(s => ({...s, sms: false})) }
  }

  const addSubject = async () => {
    if (!newSubject.name || !newSubject.code) { addToast('Name and code are required', 'warning'); return }
    setSaving(s => ({...s, subject: true}))
    try {
      const { data } = await client.post('/subjects', newSubject)
      setSubjects(prev => [...prev, data])
      setNewSubject({ name: '', code: '' })
      addToast('Subject added', 'success')
    } catch (err) { addToast(err.response?.data?.detail || 'Failed to add subject', 'error') }
    finally { setSaving(s => ({...s, subject: false})) }
  }

  const deleteSubject = async (id) => {
    try { await client.delete(`/subjects/${id}`); setSubjects(prev => prev.filter(s => s.id !== id)); addToast('Subject removed', 'success') }
    catch { addToast('Failed to remove subject', 'error') }
  }

  const changePassword = async () => {
    if (passwords.new_password !== passwords.confirm) { addToast('Passwords do not match', 'warning'); return }
    if (passwords.new_password.length < 6) { addToast('New password must be at least 6 characters', 'warning'); return }
    setSaving(s => ({...s, password: true}))
    try {
      await client.post('/auth/change-password', { current_password: passwords.current_password, new_password: passwords.new_password })
      addToast('Password changed successfully', 'success')
      setPasswords({ current_password: '', new_password: '', confirm: '' })
    } catch (err) { addToast(err.response?.data?.detail || 'Failed to change password', 'error') }
    finally { setSaving(s => ({...s, password: false})) }
  }

  if (loading) return <LoadingSpinner className="py-16" />

  const Section = ({ icon, title, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="font-display text-navy text-lg font-semibold mb-5 flex items-center gap-2">{icon} {title}</h2>
      {children}
    </div>
  )

  return (
    <div className="p-6 lg:p-8 fade-in max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl lg:text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage school information, subjects, and system configuration</p>
      </div>

      {/* School info */}
      {currentUser?.role === 'admin' && (
        <Section icon={<School size={18} className="text-gold" />} title="School Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[['name','School Name'],['address','Address'],['headmaster','Headmaster Name'],['phone','School Phone'],['email','School Email']].map(([key, label]) => (
              <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
                <input value={school[key] || ''} onChange={e => setSchool(s => ({...s, [key]: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
              </div>
            ))}
          </div>
          <button onClick={saveSchool} disabled={saving.school} className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all disabled:opacity-60">
            {saving.school ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save School Info</>}
          </button>
        </Section>
      )}

      {/* Subjects */}
      <Section icon={<BookOpen size={18} className="text-gold" />} title="Subject Management">
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {subjects.map(s => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-navy">{s.name}</span>
                <span className="text-xs bg-navy/10 text-navy px-2 py-0.5 rounded-md font-mono">{s.code}</span>
              </div>
              {currentUser?.role === 'admin' && (
                <button onClick={() => deleteSubject(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
              )}
            </div>
          ))}
          {subjects.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No subjects added yet</p>}
        </div>
        {currentUser?.role === 'admin' && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <input value={newSubject.name} onChange={e => setNewSubject(s => ({...s, name: e.target.value}))} placeholder="Subject name" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <input value={newSubject.code} onChange={e => setNewSubject(s => ({...s, code: e.target.value.toUpperCase()}))} placeholder="CODE" className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <button onClick={addSubject} disabled={saving.subject} className="flex items-center gap-1.5 bg-gold text-navy px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-600 transition-all disabled:opacity-60">
              <Plus size={14} /> Add
            </button>
          </div>
        )}
      </Section>

      {/* SMS Config */}
      {currentUser?.role === 'admin' && (
        <Section icon={<MessageSquare size={18} className="text-gold" />} title="SMS Configuration">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Provider</label>
              <select value={school.sms_provider || 'africas_talking'} onChange={e => setSchool(s => ({...s, sms_provider: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40">
                <option value="africas_talking">Africa's Talking</option>
                <option value="custom">Custom Gateway</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Username</label>
              <input value={school.sms_username || ''} onChange={e => setSchool(s => ({...s, sms_username: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">API Key</label>
              <div className="relative">
                <input type={showKey ? 'text' : 'password'} value={school.sms_api_key || ''} onChange={e => setSchool(s => ({...s, sms_api_key: e.target.value}))} className="w-full px-3 py-2.5 pr-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
                <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-3 text-gray-400">{showKey ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sender ID</label>
              <input value={school.sms_sender_id || ''} onChange={e => setSchool(s => ({...s, sms_sender_id: e.target.value}))} placeholder="e.g. SmartSchola" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
          </div>
          <button onClick={saveSMS} disabled={saving.sms} className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all disabled:opacity-60">
            {saving.sms ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save SMS Settings</>}
          </button>
        </Section>
      )}

      {/* Change Password */}
      <Section icon={<Lock size={18} className="text-gold" />} title="Change Password">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[['current_password','Current Password'],['new_password','New Password'],['confirm','Confirm New']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
              <input type="password" value={passwords[key]} onChange={e => setPasswords(p => ({...p, [key]: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
          ))}
        </div>
        <button onClick={changePassword} disabled={saving.password} className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all disabled:opacity-60">
          {saving.password ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={14} /> Change Password</>}
        </button>
      </Section>

      {/* System Info */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-xs text-gray-500 space-y-1">
        <p><strong className="text-gray-700">Smart Schola ProMax v1.0</strong> · BlesstechX</p>
        <p>API: <code className="bg-gray-100 px-1 rounded text-xs">{API_URL}</code></p>
        <p>Environment: <code className="bg-gray-100 px-1 rounded text-xs">{import.meta.env.MODE}</code></p>
      </div>
    </div>
  )
}
