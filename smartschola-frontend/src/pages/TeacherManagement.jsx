import { useCallback, useEffect, useState } from 'react'
import { Bell, BookOpen, Check, Copy, GraduationCap, RefreshCw, ShieldCheck, UserPlus, Users, X } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { apiRequest } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
const readImage=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})

export default function TeacherManagement() {
  const { addToast } = useToast()
  const { currentUser } = useAuth()
  const [teachers,setTeachers] = useState([])
  const [applications,setApplications] = useState([])
  const [studentRequests,setStudentRequests] = useState([])
  const [classes,setClasses] = useState([])
  const [assignments,setAssignments] = useState([])
  const [selected,setSelected] = useState([])
  const [form,setForm] = useState({full_name:'',email:'',phone:'',qualifications:'',subjects:'',years_experience:'',avatar_data:''})
  const [assignment,setAssignment] = useState({membership_id:'',class_id:''})
  const [notice,setNotice] = useState({title:'',message:'',send_to_all:true})
  const [setup,setSetup] = useState('')
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [busy,setBusy] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t,c,a,apps,students] = await Promise.all([
        apiRequest('/api/teachers'), apiRequest('/api/classes'), apiRequest('/api/teacher-assignments'),
        apiRequest('/api/teacher-applications'), apiRequest('/api/student-enrollment-requests')
      ])
      setTeachers(t.teachers||[]); setClasses(c.classes||[]); setAssignments(a.assignments||[])
      setApplications(apps.applications||[]); setStudentRequests(students.requests||[])
    } catch(e) { addToast(e.message||'Teacher and recruitment information could not be loaded.','error') }
    finally { setLoading(false) }
  },[addToast])
  useEffect(()=>{load()},[load])

  const invite = async e => {
    e.preventDefault(); setSaving(true); setSetup('')
    try { const r=await apiRequest('/api/teachers',{method:'POST',body:JSON.stringify(form)});setSetup(r.setup_url);setForm({full_name:'',email:'',phone:'',qualifications:'',subjects:'',years_experience:'',avatar_data:''});addToast('Manual teacher account created. Share the one-time setup link securely.','success');await load() }
    catch(e){addToast(e.message||'Could not create teacher account.','error')} finally{setSaving(false)}
  }
  const toggle = async t => {
    try { const r=await apiRequest('/api/teachers/'+t.membership_id+'/role',{method:'PATCH',body:JSON.stringify({is_admin:t.role!=='admin'})});addToast(r.role==='admin'?'Administrator access enabled.':'Teacher access restored.','success');await load() }
    catch(e){addToast(e.message||'Could not update role.','error')}
  }
  const assign = async e => {
    e.preventDefault()
    try { await apiRequest('/api/teacher-assignments',{method:'POST',body:JSON.stringify(assignment)});setAssignment({membership_id:'',class_id:''});addToast('Class assignment saved.','success');await load() }
    catch(e){addToast(e.message||'Could not assign teacher.','error')}
  }
  const remove = async id => {
    try { await apiRequest('/api/teacher-assignments/'+id,{method:'DELETE'});addToast('Class assignment removed.','success');await load() }
    catch(e){addToast(e.message||'Could not remove assignment.','error')}
  }
  const reviewTeacher = async (item,status) => {
    setBusy(item.membership_id)
    try { await apiRequest('/api/teacher-applications/'+item.membership_id,{method:'PATCH',body:JSON.stringify({status})});addToast(status==='active'?'Teacher application approved. The teacher can now sign in with their own password.':'Teacher application declined.','success');await load() }
    catch(e){addToast(e.message||'Could not update teacher application.','error')} finally{setBusy('')}
  }
  const sendNotice = async e => {
    e.preventDefault();setSaving(true)
    try { const r=await apiRequest('/api/teacher-notifications',{method:'POST',body:JSON.stringify({...notice,membership_ids:notice.send_to_all?[]:selected})});addToast('Notification delivered to '+r.recipient_count+' teacher(s).','success');setNotice({title:'',message:'',send_to_all:true});setSelected([]) }
    catch(e){addToast(e.message||'Could not send notification.','error')} finally{setSaving(false)}
  }
  const pendingTeachers=applications.filter(a=>a.status==='pending')
  const activeTeachers=teachers.filter(t=>t.status==='active')

  return <div className="p-6">
    <PageHeader title="Teacher management" subtitle="Recruit staff, manage class responsibilities, review applications and communicate with teachers." action={<button className="ss-secondary-action" onClick={load}><RefreshCw size={15}/>Refresh</button>}/>
    <div className="teacher-summary-grid"><div><Users/><strong>{activeTeachers.length}</strong><span>Active teaching staff</span></div><div><Clock3Icon/><strong>{pendingTeachers.length}</strong><span>Pending teacher applications</span></div><div><BookOpen/><strong>{assignments.length}</strong><span>Class assignments</span></div><div><GraduationCap/><strong>{studentRequests.filter(r=>r.status==='pending').length}</strong><span>Student requests awaiting teachers</span></div></div>

    <div className="teacher-management-columns">
      <section className="teacher-panel"><h2><UserPlus/> Manual teacher entry</h2><p>For teachers entered by school leadership. They receive a one-time password setup link and create their own private password.</p><form onSubmit={invite}><label>Teacher profile photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>250*1024){addToast('Choose a PNG, JPG or WebP photo under 250 KB.','warning');return}try{const avatar_data=await readImage(file);setForm(v=>({...v,avatar_data}))}catch{addToast('Could not read profile photo.','error')}}}/></label>{form.avatar_data&&<img className="teacher-manual-photo-preview" src={form.avatar_data} alt="Teacher profile preview"/>}<label>Full name<input required value={form.full_name} onChange={e=>setForm(v=>({...v,full_name:e.target.value}))}/></label><label>Email address<input required type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))}/></label><label>Phone number<input value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))}/></label><label>Qualifications<input value={form.qualifications} onChange={e=>setForm(v=>({...v,qualifications:e.target.value}))} placeholder="e.g. Diploma in Education"/></label><label>Subjects / specialisation<input value={form.subjects} onChange={e=>setForm(v=>({...v,subjects:e.target.value}))} placeholder="e.g. Mathematics, Science"/></label><label>Years of experience<input type="number" min="0" max="60" value={form.years_experience} onChange={e=>setForm(v=>({...v,years_experience:e.target.value}))}/></label><button disabled={saving}>{saving?'Creating…':'Create teacher account'}</button></form>{setup&&<div className="teacher-setup-link"><strong>One-time setup link · expires in 24 hours</strong><span>{setup}</span><button type="button" onClick={()=>navigator.clipboard?.writeText(setup).then(()=>addToast('Setup link copied.','success'))}><Copy size={14}/>Copy link</button></div>}</section>
      <section className="teacher-panel"><h2><BookOpen/> Assign a class</h2><p>Connect active teachers to the classes they are responsible for.</p><form onSubmit={assign}><label>Teacher<select required value={assignment.membership_id} onChange={e=>setAssignment(v=>({...v,membership_id:e.target.value}))}><option value="">Choose teacher</option>{activeTeachers.map(t=><option key={t.membership_id} value={t.membership_id}>{t.full_name} · {t.role}</option>)}</select></label><label>Class<select required value={assignment.class_id} onChange={e=>setAssignment(v=>({...v,class_id:e.target.value}))}><option value="">Choose class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button disabled={!classes.length||!activeTeachers.length}>Save assignment</button></form></section>
    </div>

    <section className="teacher-panel teacher-recruitment-panel"><div className="teacher-roster-heading"><div><h2><ShieldCheck/> Online teacher applications</h2><p>Applicants submit their own profile, photo and credentials. Approving activates their account without revealing their password.</p></div><button className="ss-secondary-action" type="button" onClick={()=>{const link=window.location.origin+'/join/'+currentUser?.school_slug;navigator.clipboard?.writeText(link).then(()=>addToast('School registration link copied. Share it with teachers and families.','success'))}}><Copy size={14}/>Copy school registration link</button></div>
      {loading?<div className="py-8 flex justify-center"><LoadingSpinner size={25}/></div>:applications.length===0?<p className="teacher-empty">No online teacher applications yet. Share the school's public registration link to invite teachers.</p>:<div className="teacher-applicant-list">{applications.map(item=><article className="teacher-applicant-card" key={item.membership_id}><div className="teacher-applicant-person"><span>{item.avatar_data?<img src={item.avatar_data} alt=""/>:<UserPlus size={22}/>}</span><div><strong>{item.full_name}</strong><small>{item.email} · {item.phone||'No phone supplied'}</small><small>{item.qualifications||'Qualifications not supplied'} · {item.subjects||'Subjects not supplied'} · {item.years_experience||0} years experience</small></div><em className={'teacher-application-state '+item.status}>{item.status}</em></div>{item.message&&<p className="teacher-applicant-message">{item.message}</p>}{item.status==='pending'&&<div className="teacher-applicant-actions"><button disabled={busy===item.membership_id} className="reject" onClick={()=>reviewTeacher(item,'suspended')}><X size={14}/>Decline</button><button disabled={busy===item.membership_id} className="approve" onClick={()=>reviewTeacher(item,'active')}><Check size={14}/>{busy===item.membership_id?'Saving…':'Approve teacher'}</button></div>}</article>)}</div>}
    </section>

    <section className="teacher-panel teacher-notice-panel"><h2><Bell/> Send a teacher notification</h2><p>Send a private SmartSchola notification to every active teacher or only the staff you select.</p><form onSubmit={sendNotice}><label>Notification title<input required maxLength="120" value={notice.title} onChange={e=>setNotice(v=>({...v,title:e.target.value}))} placeholder="e.g. Staff meeting on Friday"/></label><label>Message<textarea required rows="3" maxLength="2000" value={notice.message} onChange={e=>setNotice(v=>({...v,message:e.target.value}))} placeholder="Write the message for your teachers…"/></label><div className="teacher-notice-target"><label><input type="radio" checked={notice.send_to_all} onChange={()=>setNotice(v=>({...v,send_to_all:true}))}/> All active teachers</label><label><input type="radio" checked={!notice.send_to_all} onChange={()=>setNotice(v=>({...v,send_to_all:false}))}/> Selected teachers</label></div>{!notice.send_to_all&&<div className="teacher-recipient-picker">{activeTeachers.map(t=><label key={t.membership_id}><input type="checkbox" checked={selected.includes(t.membership_id)} onChange={e=>setSelected(v=>e.target.checked?[...v,t.membership_id]:v.filter(id=>id!==t.membership_id))}/>{t.full_name} <small>{t.email}</small></label>)}</div>}<button disabled={saving||(!notice.send_to_all&&!selected.length)}>{saving?'Sending…':'Send notification'}</button></form></section>

    <section className="teacher-panel teacher-roster"><div className="teacher-roster-heading"><div><h2>Teaching staff</h2><p>Activity indicators are operational counts, not formal performance ratings.</p></div></div>{loading?<div className="py-8 flex justify-center"><LoadingSpinner size={25}/></div>:teachers.length===0?<p className="teacher-empty">No active teaching staff yet.</p>:<div className="teacher-table-wrap"><table><thead><tr><th>Teacher</th><th>Classes</th><th>Assessments created</th><th>Attendance sessions</th><th>Access</th></tr></thead><tbody>{teachers.map(t=><tr key={t.membership_id}><td><strong>{t.full_name}</strong><small>{t.email}</small></td><td>{t.class_count}</td><td>{t.assessments_created}</td><td>{t.attendance_sessions}</td><td><button className={t.role==='admin'?'teacher-admin-toggle enabled':'teacher-admin-toggle'} onClick={()=>toggle(t)}><span/>{t.role==='admin'?'Admin enabled':'Grant admin'}</button></td></tr>)}</tbody></table></div>}</section>

    <section className="teacher-panel teacher-assignments"><h2>Class responsibility</h2>{assignments.length===0?<p className="teacher-empty">No class assignments yet.</p>:assignments.map(a=><div key={a.id}><span><strong>{a.class_name}</strong><small>{a.teacher_name}</small></span><button onClick={()=>remove(a.id)}>Remove</button></div>)}</section>

    <section className="teacher-panel teacher-student-overview"><div className="teacher-roster-heading"><div><h2><GraduationCap/> Student registration overview</h2><p>Administrators can monitor request status. Approval remains with the teacher assigned to each class.</p></div></div>{loading?<div className="py-6 flex justify-center"><LoadingSpinner size={24}/></div>:studentRequests.length?<div className="teacher-table-wrap"><table><thead><tr><th>Learner</th><th>Class</th><th>Assigned teacher</th><th>Email</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{studentRequests.map(r=><tr key={r.id}><td>{r.first_name} {r.last_name}</td><td>{r.class_name}</td><td>{r.assigned_teacher_count>0?'Assigned':'No teacher assigned'}</td><td>{r.email}</td><td><em className={'teacher-application-state '+r.status}>{r.status}</em></td><td>{new Date(r.created_at).toLocaleDateString('en-ZM')}</td></tr>)}</tbody></table></div>:<p className="teacher-empty">No student registration requests have been received.</p>}</section>
  </div>
}

function Clock3Icon(){return <span className="teacher-clock-icon">◷</span>}
