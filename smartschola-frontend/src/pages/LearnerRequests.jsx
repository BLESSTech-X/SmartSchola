import { useCallback, useEffect, useState } from 'react'
import { Check, Clock3, GraduationCap, RefreshCw, ShieldCheck, X } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { apiRequest } from '../lib/api.js'
import { useToast } from '../context/ToastContext.jsx'

export default function LearnerRequests() {
  const { addToast } = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const result = await apiRequest('/api/teacher/student-enrollment-requests'); setRequests(result.requests || []) }
    catch (e) { addToast(e.message || 'Learner requests could not be loaded.', 'error') }
    finally { setLoading(false) }
  }, [addToast])

  useEffect(() => { load() }, [load])

  const review = async (item, status) => {
    setBusy(item.id)
    try {
      const result = await apiRequest('/api/teacher/student-enrollment-requests/' + item.id, { method:'PATCH', body:JSON.stringify({ status }) })
      addToast(status==='approved' ? 'Learner approved and enrolled. Student number: ' + result.student_number : 'Learner registration declined.', 'success')
      await load()
    } catch (e) { addToast(e.message || 'The learner request could not be updated.', 'error') }
    finally { setBusy('') }
  }

  return <div className="p-6">
    <PageHeader title="Learner registration requests" subtitle="Review registrations only for the classes assigned to you." action={<button className="ss-secondary-action" onClick={load}><RefreshCw size={15}/>Refresh</button>}/>
    <div className="learner-request-notice"><ShieldCheck size={19}/><span><strong>Teacher approval required.</strong> Only the assigned class teacher can approve a learner. School administrators can see request status but cannot approve on your behalf.</span></div>
    {loading ? <div className="py-16 flex justify-center"><LoadingSpinner size={28}/></div> : requests.length ? <div className="learner-request-grid">{requests.map(item=><article className="learner-request-card" key={item.id}>
      <div className="learner-request-person"><span className="learner-request-avatar">{item.avatar_data?<img src={item.avatar_data} alt=""/>:<GraduationCap size={23}/>}</span><div><strong>{item.first_name} {item.last_name}</strong><small>{item.email}</small></div><span className="learner-request-status"><Clock3 size={13}/> Pending</span></div>
      <div className="learner-request-details"><span><small>Class</small><strong>{item.class_name}</strong></span><span><small>Grade / level</small><strong>{item.grade}</strong></span><span><small>Date submitted</small><strong>{new Date(item.created_at).toLocaleDateString('en-ZM')}</strong></span><span><small>Guardian</small><strong>{item.guardian_name}</strong></span><span><small>Guardian phone</small><strong>{item.guardian_phone}</strong></span><span><small>Previous school</small><strong>{item.previous_school || 'Not provided'}</strong></span></div>
      <div className="learner-request-actions"><button disabled={busy===item.id} onClick={()=>review(item,'rejected')} className="reject"><X size={15}/>Decline</button><button disabled={busy===item.id} onClick={()=>review(item,'approved')} className="approve"><Check size={15}/>{busy===item.id?'Processing…':'Approve & enrol'}</button></div>
    </article>)}</div> : <div className="learner-request-empty"><GraduationCap size={30}/><h2>No pending learner registrations</h2><p>New requests for your assigned classes will appear here.</p></div>}
  </div>
}
