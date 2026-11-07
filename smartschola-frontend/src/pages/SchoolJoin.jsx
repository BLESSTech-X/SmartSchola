import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, GraduationCap, LoaderCircle, School, ShieldCheck, UserRound } from 'lucide-react'
import { apiRequest } from '../lib/api.js'

const readImage = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

export default function SchoolJoin() {
  const { slug } = useParams()
  const [data, setData] = useState({ school: null, classes: [] })
  const [role, setRole] = useState('teacher')
  const [photo, setPhoto] = useState('')
  const [form, setForm] = useState({ full_name:'', first_name:'', last_name:'', email:'', password:'', phone:'', qualifications:'', subjects:'', years_experience:'', message:'', class_id:'', grade:'', date_of_birth:'', gender:'', guardian_name:'', guardian_phone:'', previous_school:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/api/public/schools/' + encodeURIComponent(slug) + '/join-options')
      .then(result => { if (active) setData(result) })
      .catch(e => { if (active) setError(e.message || 'This school could not be found.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  const change = (key, value) => setForm(v => ({ ...v, [key]: value }))
  const upload = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 250 * 1024) {
      setError('Choose a PNG, JPG or WebP photo smaller than 250 KB.')
      return
    }
    try { setPhoto(await readImage(file)); setError('') } catch { setError('The selected photo could not be read.') }
  }

  const submit = async event => {
    event.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      if (role === 'teacher') {
        const result = await apiRequest('/api/public/schools/' + encodeURIComponent(slug) + '/teacher-applications', {
          method:'POST', token:'', body:JSON.stringify({ ...form, avatar_data:photo })
        })
        setSuccess(result.message || 'Your teacher application has been submitted.')
      } else {
        const result = await apiRequest('/api/public/schools/' + encodeURIComponent(slug) + '/student-applications', {
          method:'POST', token:'', body:JSON.stringify({ ...form, avatar_data:photo })
        })
        setSuccess(result.message || 'Your learner registration has been submitted.')
      }
      setPhoto('')
      setForm({ full_name:'', first_name:'', last_name:'', email:'', password:'', phone:'', qualifications:'', subjects:'', years_experience:'', message:'', class_id:'', grade:'', date_of_birth:'', gender:'', guardian_name:'', guardian_phone:'', previous_school:'' })
    } catch (e) { setError(e.message || 'Your registration could not be submitted.') }
    finally { setSaving(false) }
  }

  if (loading) return <main className="school-join-page"><div className="school-join-loading"><LoaderCircle className="spin" size={28}/>Loading school registration…</div></main>
  if (!data.school) return <main className="school-join-page"><section className="school-join-card"><School size={34}/><h1>School not found</h1><p>{error || 'This school is not available for registration.'}</p><Link to="/school-sign-in">Find your school</Link></section></main>

  return <main className="school-join-page">
    <header className="school-join-topbar">
      <Link to={'/s/' + slug} className="school-join-back"><ArrowLeft size={16}/> Back to school</Link>
      <Link to="/" className="school-join-brand"><GraduationCap size={23}/> SmartSchola</Link>
    </header>
    <section className="school-join-shell">
      <div className="school-join-intro">
        <span className="school-join-kicker"><ShieldCheck size={15}/> SCHOOL REGISTRATION</span>
        <div className="school-join-school-mark">{data.school.logo_data ? <img src={data.school.logo_data} alt=""/> : <School size={30}/>}</div>
        <h1>Join <span>{data.school.name}</span></h1>
        <p>Submit your details directly to the school. Your information is reviewed by the appropriate school staff before access is activated.</p>
        <div className="school-join-security"><ShieldCheck size={17}/><span>Your password is private. It is never shown to school staff.</span></div>
      </div>
      <section className="school-join-form-card">
        <div className="school-join-role-switch">
          <button type="button" className={role==='teacher'?'active':''} onClick={()=>{setRole('teacher');setError('');setSuccess('')}}><UserRound size={17}/> Register as a teacher</button>
          <button type="button" className={role==='student'?'active':''} onClick={()=>{setRole('student');setError('');setSuccess('')}}><GraduationCap size={17}/> Register as a learner</button>
        </div>
        {success ? <div className="school-join-success"><CheckCircle2 size={34}/><h2>Registration received</h2><p>{success}</p><p className="school-join-next">You can sign in with your email and private password after the school approves your request.</p><button type="button" onClick={()=>{setSuccess('');setError('')}}>Submit another registration</button><Link to={'/s/'+slug}>Return to school page</Link></div> :
        <form className="school-join-form" onSubmit={submit}>
          <div className="school-join-form-heading"><h2>{role==='teacher'?'Teacher application':'Learner registration'}</h2><p>{role==='teacher'?'Share your professional details so the headmaster can recognise and review your application.':'Tell the school who you are and which class you are joining.'}</p></div>
          <label className="school-join-photo"><span className="school-join-photo-preview">{photo?<img src={photo} alt="Profile preview"/>:<Camera size={22}/>}</span><span><strong>Profile photo</strong><small>Optional · PNG, JPG or WebP · up to 250 KB</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></span></label>
          {role==='teacher' ? <>
            <div className="school-join-two"><label>Full name<input required value={form.full_name} onChange={e=>change('full_name',e.target.value)} autoComplete="name"/></label><label>Phone number<input required value={form.phone} onChange={e=>change('phone',e.target.value)} autoComplete="tel"/></label></div>
            <label>Email address<input required type="email" value={form.email} onChange={e=>change('email',e.target.value)} autoComplete="email"/></label>
            <label>Qualifications<input value={form.qualifications} onChange={e=>change('qualifications',e.target.value)} placeholder="e.g. Diploma in Primary Education"/></label>
            <div className="school-join-two"><label>Subjects / specialisation<input value={form.subjects} onChange={e=>change('subjects',e.target.value)} placeholder="e.g. Mathematics, Science"/></label><label>Years of experience<input type="number" min="0" max="60" value={form.years_experience} onChange={e=>change('years_experience',e.target.value)}/></label></div>
            <label>Message to the headmaster<textarea rows="3" value={form.message} onChange={e=>change('message',e.target.value)} placeholder="Anything the school should know about your application"/></label>
          </> : <>
            <div className="school-join-two"><label>Learner first name<input required value={form.first_name} onChange={e=>change('first_name',e.target.value)} autoComplete="given-name"/></label><label>Learner last name<input required value={form.last_name} onChange={e=>change('last_name',e.target.value)} autoComplete="family-name"/></label></div>
            <label>Learner email address<input required type="email" value={form.email} onChange={e=>change('email',e.target.value)} autoComplete="email"/></label>
            <div className="school-join-two"><label>Class<select required value={form.class_id} onChange={e=>change('class_id',e.target.value)}><option value="">Choose a class</option>{data.classes.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Grade / level<input required value={form.grade} onChange={e=>change('grade',e.target.value)} placeholder="e.g. Grade 7"/></label></div>
            <div className="school-join-two"><label>Date of birth<input type="date" value={form.date_of_birth} onChange={e=>change('date_of_birth',e.target.value)}/></label><label>Gender<select value={form.gender} onChange={e=>change('gender',e.target.value)}><option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option></select></label></div>
            <label>Parent / guardian full name<input required value={form.guardian_name} onChange={e=>change('guardian_name',e.target.value)}/></label>
            <div className="school-join-two"><label>Parent / guardian phone<input required value={form.guardian_phone} onChange={e=>change('guardian_phone',e.target.value)} autoComplete="tel"/></label><label>Previous school<input value={form.previous_school} onChange={e=>change('previous_school',e.target.value)}/></label></div>
          </>}
          <label>Create your private password<input required type="password" minLength="10" maxLength="128" value={form.password} onChange={e=>change('password',e.target.value)} autoComplete="new-password"/><small>At least 10 characters. School staff cannot view this password.</small></label>
          {error&&<div className="school-join-error" role="alert">{error}</div>}
          <button className="school-join-submit" disabled={saving || (role==='student'&&!data.classes.length)}>{saving?'Submitting securely…':role==='teacher'?'Send teacher application':'Send learner registration'} <ArrowRight size={17}/></button>
          {role==='student'&&!data.classes.length&&<p className="school-join-no-classes">This school has not published its classes yet. Please contact the school office.</p>}
          <p className="school-join-terms">By submitting, you confirm that the information is accurate and may be reviewed by authorised school staff. Passwords remain private.</p>
        </form>}
      </section>
    </section>
    <footer className="school-join-footer">© {new Date().getFullYear()} SmartSchola · Schools. Families. Futures.</footer>
  </main>
}
