import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import client from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="font-display font-semibold text-base mb-5 pb-3 border-b border-gray-100" style={{ color:'#0B1D3A' }}>{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inp = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"

export default function Settings() {
  const [school, setSchool] = useState({ name:'', address:'', headmaster_name:'', phone:'', email:'', sms_provider:'africas_talking', sms_api_key:'', sms_username:'', sms_sender_id:'SmartSchola' })
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState({ name:'', code:'' })
  const [pw, setPw] = useState({ current_password:'', new_password:'', confirm_password:'' })
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingSchool, setSavingSchool] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [addingSubject, setAddingSubject] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    Promise.all([
      client.get('/settings').catch(() => ({ data: {} })),
      client.get('/subjects').catch(() => ({ data: [] }))
    ]).then(([sRes, subRes]) => {
      if (sRes.data && sRes.data.name !== undefined) setSchool(p => ({ ...p, ...sRes.data }))
      setSubjects(subRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const saveSchool = async () => {
    setSavingSchool(true)
    try {
      await client.put('/settings', school)
      addToast('School settings saved','success')
    } catch { addToast('Save failed','error') }
    finally { setSavingSchool(false) }
  }

  const changePw = async () => {
    if (!pw.current_password || !pw.new_password) { addToast('Fill all password fields','warning'); return }
    if (pw.new_password !== pw.confirm_password) { addToast('Passwords do not match','warning'); return }
    setSavingPw(true)
    try {
      await client.post('/auth/change-password', pw)
      addToast('Password changed successfully','success')
      setPw({ current_password:'', new_password:'', confirm_password:'' })
    } catch (err) { addToast(err.response?.data?.detail||'Change failed','error') }
    finally { setSavingPw(false) }
  }

  const addSubject = async () => {
    if (!newSubject.name || !newSubject.code) { addToast('Name and code required','warning'); return }
    setAddingSubject(true)
    try {
      const r = await client.post('/subjects', newSubject)
      setSubjects(p => [...p, r.data])
      setNewSubject({ name:'', code:'' })
      addToast('Subject added','success')
    } catch (err) { addToast(err.response?.data?.detail||'Failed','error') }
    finally { setAddingSubject(false) }
  }

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject?')) return
    try {
      await client.delete(`/subjects/${id}`)
      setSubjects(p => p.filter(s => s.id !== id))
      addToast('Subject removed','success')
    } catch { addToast('Delete failed','error') }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size={32} /></div>

  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Settings" subtitle="Configure your school system" />

      {/* School Info */}
      <Section title="School Information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="School Name"><input className={inp} value={school.name} onChange={e => setSchool(p=>({...p,name:e.target.value}))} placeholder="e.g. Chawama Basic School" /></Field>
          <Field label="Headmaster Name"><input className={inp} value={school.headmaster_name} onChange={e => setSchool(p=>({...p,headmaster_name:e.target.value}))} /></Field>
          <Field label="Phone"><input className={inp} value={school.phone} onChange={e => setSchool(p=>({...p,phone:e.target.value}))} placeholder="+260..." /></Field>
          <Field label="Email"><input className={inp} type="email" value={school.email} onChange={e => setSchool(p=>({...p,email:e.target.value}))} /></Field>
          <div className="col-span-2">
            <Field label="Address"><input className={inp} value={school.address} onChange={e => setSchool(p=>({...p,address:e.target.value}))} /></Field>
          </div>
        </div>
        <button onClick={saveSchool} disabled={savingSchool} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 disabled:opacity-60" style={{ background:'#0B1D3A' }}>
          {savingSchool && <LoadingSpinner size={14} color="white" />}{savingSchool ? 'Saving...' : 'Save School Info'}
        </button>
      </Section>

      {/* SMS Config */}
      <Section title="SMS Configuration">
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMS Provider">
            <select className={inp} value={school.sms_provider} onChange={e => setSchool(p=>({...p,sms_provider:e.target.value}))}>
              <option value="africas_talking">Africa's Talking</option>
              <option value="custom">Custom Gateway</option>
            </select>
          </Field>
          <Field label="Sender ID"><input className={inp} value={school.sms_sender_id} onChange={e => setSchool(p=>({...p,sms_sender_id:e.target.value}))} placeholder="SmartSchola" /></Field>
          <Field label="API Username"><input className={inp} value={school.sms_username} onChange={e => setSchool(p=>({...p,sms_username:e.target.value}))} /></Field>
          <Field label="API Key">
            <div className="relative">
              <input className={inp + ' pr-10'} type={showKey?'text':'password'} value={school.sms_api_key} onChange={e => setSchool(p=>({...p,sms_api_key:e.target.value}))} placeholder="Your API key" />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
        </div>
        <p className="text-xs text-gray-400 mt-3">💡 No API key? SMS will be logged to <code>sms_log.txt</code> on the server for testing.</p>
        <button onClick={saveSchool} disabled={savingSchool} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 disabled:opacity-60" style={{ background:'#0B1D3A' }}>
          {savingSchool && <LoadingSpinner size={14} color="white" />}Save SMS Settings
        </button>
      </Section>

      {/* Subjects */}
      <Section title="Subjects Management">
        <div className="space-y-2 mb-4">
          {subjects.length === 0 ? <p className="text-sm text-gray-400">No subjects added yet.</p> : subjects.map(s => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div>
                <span className="text-sm font-medium text-gray-800">{s.name}</span>
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{s.code}</span>
              </div>
              <button onClick={() => deleteSubject(s.id)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={inp + ' flex-1'} placeholder="Subject name" value={newSubject.name} onChange={e => setNewSubject(p=>({...p,name:e.target.value}))} />
          <input className={inp + ' w-28'} placeholder="Code (MATH)" value={newSubject.code} onChange={e => setNewSubject(p=>({...p,code:e.target.value.toUpperCase()}))} />
          <button onClick={addSubject} disabled={addingSubject} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 hover:opacity-90 disabled:opacity-60" style={{ background:'#0B1D3A' }}>
            {addingSubject ? <LoadingSpinner size={14} color="white" /> : <Plus size={14} />}Add
          </button>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Change Password">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Current Password"><input type="password" className={inp} value={pw.current_password} onChange={e => setPw(p=>({...p,current_password:e.target.value}))} /></Field>
          <Field label="New Password"><input type="password" className={inp} value={pw.new_password} onChange={e => setPw(p=>({...p,new_password:e.target.value}))} /></Field>
          <Field label="Confirm Password"><input type="password" className={inp} value={pw.confirm_password} onChange={e => setPw(p=>({...p,confirm_password:e.target.value}))} /></Field>
        </div>
        <button onClick={changePw} disabled={savingPw} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 disabled:opacity-60" style={{ background:'#0B1D3A' }}>
          {savingPw && <LoadingSpinner size={14} color="white" />}{savingPw ? 'Changing...' : 'Change Password'}
        </button>
      </Section>

      {/* System Info */}
      <Section title="System Info">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Version</span><span className="font-medium">Smart Schola v1.0</span></div>
          <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">Backend URL</span><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{import.meta.env.VITE_API_URL||'http://localhost:8000'}</code></div>
          <div className="flex justify-between py-1.5"><span className="text-gray-400">Built for</span><span className="font-medium">Zambian Schools</span></div>
        </div>
      </Section>
    </div>
  )
}
