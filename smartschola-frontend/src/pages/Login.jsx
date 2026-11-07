import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, LockKeyhole, ShieldCheck, UserRound, BookOpen, BriefcaseBusiness, Camera, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiRequest, apiConfigured } from '../lib/api.js'

const roles = [
  { id: 'headmaster', label: 'Headmaster', icon: BriefcaseBusiness, description: 'School leadership and management', identityLabel: 'Headmaster email address', identityPlaceholder: 'name@school.edu.zm' },
  { id: 'teacher', label: 'Teacher', icon: BookOpen, description: 'Classes, marks and learner records', identityLabel: 'School account email address', identityPlaceholder: 'Email registered with your school' },
  { id: 'student', label: 'Student', icon: GraduationCap, description: 'Learning, results and school updates', identityLabel: 'Student account email address', identityPlaceholder: 'Student email address' },
  { id: 'parent', label: 'Parent / Guardian', icon: UserRound, description: 'Your child’s updates and reports', identityLabel: 'Parent / guardian email address', identityPlaceholder: 'Your registered email address' },
]
const emptyRegistration = { full_name:'', first_name:'', last_name:'', email:'', password:'', phone:'', qualifications:'', subjects:'', years_experience:'', message:'', class_id:'', grade:'', date_of_birth:'', gender:'', guardian_name:'', guardian_phone:'', previous_school:'', student_number:'', relationship:'Parent / Guardian', school_name:'', school_slug:'', school_location:'' }
const readImage = file => new Promise((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file) })

export default function Login() {
  const [form,setForm]=useState({username:'',password:''})
  const [registration,setRegistration]=useState(emptyRegistration)
  const [role,setRole]=useState('headmaster')
  const [mode,setMode]=useState('login')
  const [showPass,setShowPass]=useState(false)
  const [photo,setPhoto]=useState('')
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')
  const [loading,setLoading]=useState(false)
  const [school,setSchool]=useState(null)
  const [schoolLoading,setSchoolLoading]=useState(true)
  const [classes,setClasses]=useState([])
  const {login}=useAuth()
  const navigate=useNavigate()
  const [searchParams]=useSearchParams()
  const schoolSlug=searchParams.get('school')
  const selectedRole=roles.find(item=>item.id===role)||roles[0]
  const RoleIcon=selectedRole.icon

  useEffect(()=>{
    if(!schoolSlug){setSchoolLoading(false);return}
    let active=true
    if(!apiConfigured){setSchoolLoading(false);return ()=>{active=false}}
    Promise.all([
      apiRequest('/api/schools'),
      apiRequest('/api/public/schools/'+encodeURIComponent(schoolSlug)+'/join-options').catch(()=>({classes:[]}))
    ]).then(([directory,options])=>{
      if(!active)return
      setSchool((directory.schools||[]).find(item=>item.slug===schoolSlug)||options.school||null)
      setClasses(options.classes||[])
    }).catch(()=>{if(active)setSchool(null)}).finally(()=>{if(active)setSchoolLoading(false)})
    return ()=>{active=false}
  },[schoolSlug])

  const change=(key,value)=>setRegistration(v=>({...v,[key]:value}))
  const upload=async event=>{
    const file=event.target.files?.[0]; event.target.value=''
    if(!file)return
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>250*1024){setError('Choose a PNG, JPG or WebP photo smaller than 250 KB.');return}
    try{setPhoto(await readImage(file));setError('')}catch{setError('The selected photo could not be read.')}
  }
  const switchMode=next=>{setMode(next);setError('');setSuccess('')}

  const handleLogin=async e=>{
    e.preventDefault();setError('')
    if(!apiConfigured){setError('SmartSchola sign-in is not configured. Please contact support.');return}
    if(!schoolSlug||!school){setError('Choose a verified school before signing in.');return}
    if(!form.username.includes('@')){setError('Use the email address registered to your school account.');return}
    setLoading(true)
    try{
      const result=await apiRequest('/api/auth/login',{method:'POST',body:JSON.stringify({email:form.username.trim(),password:form.password,school_slug:school.slug,role})})
      login(result.access_token,result.user);navigate('/workspace',{replace:true})
    }catch(err){setError(err.message||'Sign-in failed. Check your email and password, then try again.')}
    finally{setLoading(false)}
  }

  const handleRegister=async e=>{
    e.preventDefault();setError('');setSuccess('')
    if(!apiConfigured){setError('SmartSchola registration is not configured. Please contact support.');return}
    if(role!=='headmaster'&&(!schoolSlug||!school)){setError('This school is not available for registration.');return}
    setLoading(true)
    try{
      let result
      if(role==='headmaster'){
        const slug=registration.school_slug.trim().toLowerCase()
        result=await apiRequest('/api/auth/register',{method:'POST',body:JSON.stringify({email:registration.email,password:registration.password,full_name:registration.full_name,school_name:registration.school_name,school_slug:slug,school_location:registration.school_location})})
      }else if(role==='teacher'){
        result=await apiRequest('/api/public/schools/'+encodeURIComponent(schoolSlug)+'/teacher-applications',{method:'POST',token:'',body:JSON.stringify({...registration,avatar_data:photo})})
      }else if(role==='student'){
        result=await apiRequest('/api/public/schools/'+encodeURIComponent(schoolSlug)+'/student-applications',{method:'POST',token:'',body:JSON.stringify({...registration,avatar_data:photo})})
      }else{
        result=await apiRequest('/api/public/schools/'+encodeURIComponent(schoolSlug)+'/parent-applications',{method:'POST',token:'',body:JSON.stringify(registration)})
      }
      setSuccess(result.message||'Your registration has been received.')
      setPhoto('')
      setRegistration(emptyRegistration)
    }catch(err){setError(err.message||'Your registration could not be submitted.')}
    finally{setLoading(false)}
  }

  if(!schoolSlug)return <Navigate to="/school-sign-in" replace/>

  return <div className="login-page">
    <aside className="login-side-panel">
      <Link to="/school-sign-in" className="login-back-link"><ArrowLeft size={16}/> Change school</Link>
      <div className="login-side-content">
        <span className="login-brand-mark"><GraduationCap size={31}/></span>
        <span className="public-section-kicker">SMARTSCHOLA SCHOOL PORTAL</span>
        <h1>One school.<br/><span>Every role connected.</span></h1>
        <p>One secure place for school leaders, teachers, learners and families. Choose your role, then sign in or register without leaving this page.</p>
        <div className="login-role-points"><span><BriefcaseBusiness size={17}/> School leadership</span><span><BookOpen size={17}/> Teaching and learning</span><span><UserRound size={17}/> Student and family access</span></div>
        <div className="login-assurance"><ShieldCheck size={18}/><span><strong>School account protection.</strong><small>Every role is checked against the selected school and its approval process.</small></span></div>
      </div>
      <div className="login-side-footer">Schools. Families. Futures.</div>
    </aside>
    <main className="login-form-side"><div className="login-form-card">
      <Link to="/" className="login-mobile-brand"><span className="public-brand-mark"><GraduationCap size={22}/></span><strong>SmartSchola</strong></Link>
      <span className="public-section-kicker">{mode==='login'?'WELCOME BACK':'NEW SCHOOL ACCOUNT'}</span>
      <h2>{mode==='login'?'Sign in to your school':'Create your account'}</h2>
      <p className="login-intro">{mode==='login'?'Enter the email and password registered with your selected school.':'Choose your role and complete the relevant registration form. Your request will follow the school’s approval process.'}</p>
      <div className="login-school-context"><GraduationCap size={17}/><span>Selected school</span><small>{schoolLoading?'Checking school…':school?.name||'School not recognised'}</small><Link to="/school-sign-in">Change</Link></div>
      {!schoolLoading&&!school&&<div role="alert" className="login-error"><ShieldCheck size={17}/><span>This school is not available. Return to the school directory and select a verified school.</span></div>}
      <div className="login-role-heading"><span>Choose your role</span><small>Login and registration use the same role</small></div>
      <div className="login-role-grid" role="group" aria-label="Choose account role">
        {roles.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" className={role===item.id?'login-role-option selected':'login-role-option'} onClick={()=>{setRole(item.id);setError('');setSuccess('')}} aria-pressed={role===item.id}><span className="login-role-icon"><Icon size={19}/></span><span className="login-role-copy"><strong>{item.label}</strong><small>{item.description}</small></span><span className="login-role-radio"/></button>})}
      </div>
      <div className="login-mode-switch" role="group" aria-label="Choose login or registration"><button type="button" className={mode==='login'?'active':''} onClick={()=>switchMode('login')}><LockKeyhole size={16}/> Login</button><button type="button" className={mode==='register'?'active':''} onClick={()=>switchMode('register')}><UserRound size={16}/> Register if new</button></div>
      {success?<div className="school-join-success login-inline-success"><CheckCircle2 size={34}/><h2>Registration received</h2><p>{success}</p><p className="school-join-next">{role==='headmaster'?'Your school will appear after SmartSchola verification.':'You can sign in with this email after the school approves your request or parent link.'}</p><button type="button" onClick={()=>switchMode('login')}>Go to login</button></div>:mode==='login'?<form onSubmit={handleLogin}>
        <label htmlFor="login-identity">{selectedRole.identityLabel}</label><input id="login-identity" type="email" autoComplete="username" required value={form.username} onChange={e=>setForm(v=>({...v,username:e.target.value}))} placeholder={selectedRole.identityPlaceholder}/>
        <label htmlFor="login-password">Password</label><div className="login-password-wrap"><input id="login-password" type={showPass?'text':'password'} autoComplete="current-password" required value={form.password} onChange={e=>setForm(v=>({...v,password:e.target.value}))} placeholder="Enter your password"/><button type="button" onClick={()=>setShowPass(v=>!v)} aria-label={showPass?'Hide password':'Show password'}>{showPass?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
        {error&&<div role="alert" className="login-error"><ShieldCheck size={17}/><span>{error}</span></div>}
        <button className="login-submit" type="submit" disabled={loading||schoolLoading||!school}><LockKeyhole size={17}/>{loading?'Checking your access…':'Login as '+selectedRole.label}</button>
      </form>:<form className="school-join-form login-inline-register" onSubmit={handleRegister}>
        <div className="school-join-form-heading"><h2>{role==='headmaster'?'Register a new school':role==='teacher'?'Teacher application':role==='student'?'Learner registration':'Parent / guardian registration'}</h2><p>{role==='headmaster'?'Create your headmaster account and submit your school for verification.':role==='teacher'?'Send your professional details to the headmaster for review.':role==='student'?'Register the learner and submit details for class-teacher approval.':'Create a parent account using your email, then request a secure link to your child’s learner record.'}</p></div>
        {role==='headmaster'?<>
          <label>Headmaster full name<input required value={registration.full_name} onChange={e=>change('full_name',e.target.value)} autoComplete="name"/></label>
          <label>Email address<input required type="email" value={registration.email} onChange={e=>change('email',e.target.value)} autoComplete="email"/></label>
          <label>School name<input required value={registration.school_name} onChange={e=>change('school_name',e.target.value)} placeholder="Official school name"/></label>
          <label>School web address name<input required value={registration.school_slug} onChange={e=>change('school_slug',e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-'))} placeholder="e.g. sunrise-academy"/><small>Use lowercase letters, numbers and hyphens. This becomes the school URL.</small></label>
          <label>School location<input value={registration.school_location} onChange={e=>change('school_location',e.target.value)} placeholder="Town / district, province"/></label>
        </>:<>
          {role!=='parent'&&<label className="school-join-photo"><span className="school-join-photo-preview">{photo?<img src={photo} alt="Profile preview"/>:<Camera size={22}/>}</span><span><strong>Profile photo</strong><small>Optional · PNG, JPG or WebP · up to 250 KB<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></small></span></label>}
          {role==='teacher'?<>
            <div className="school-join-two"><label>Full name<input required value={registration.full_name} onChange={e=>change('full_name',e.target.value)}/></label><label>Phone number<input required value={registration.phone} onChange={e=>change('phone',e.target.value)} autoComplete="tel"/></label></div>
            <label>Email address<input required type="email" value={registration.email} onChange={e=>change('email',e.target.value)} autoComplete="email"/></label>
            <label>Qualifications<input value={registration.qualifications} onChange={e=>change('qualifications',e.target.value)} placeholder="e.g. Diploma in Primary Education"/></label>
            <div className="school-join-two"><label>Subjects / specialisation<input value={registration.subjects} onChange={e=>change('subjects',e.target.value)}/></label><label>Years of experience<input type="number" min="0" max="60" value={registration.years_experience} onChange={e=>change('years_experience',e.target.value)}/></label></div>
            <label>Message to the headmaster<textarea rows="3" value={registration.message} onChange={e=>change('message',e.target.value)}/></label>
          </>:role==='student'?<>
            <div className="school-join-two"><label>Learner first name<input required value={registration.first_name} onChange={e=>change('first_name',e.target.value)}/></label><label>Learner last name<input required value={registration.last_name} onChange={e=>change('last_name',e.target.value)}/></label></div>
            <label>Learner email address<input required type="email" value={registration.email} onChange={e=>change('email',e.target.value)}/></label>
            <div className="school-join-two"><label>Class<select required value={registration.class_id} onChange={e=>change('class_id',e.target.value)}><option value="">Choose a class</option>{classes.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Grade / level<input required value={registration.grade} onChange={e=>change('grade',e.target.value)} placeholder="e.g. Grade 7"/></label></div>
            <div className="school-join-two"><label>Date of birth<input type="date" value={registration.date_of_birth} onChange={e=>change('date_of_birth',e.target.value)}/></label><label>Gender<select value={registration.gender} onChange={e=>change('gender',e.target.value)}><option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option></select></label></div>
            <label>Parent / guardian full name<input required value={registration.guardian_name} onChange={e=>change('guardian_name',e.target.value)}/></label>
            <div className="school-join-two"><label>Parent / guardian phone<input required value={registration.guardian_phone} onChange={e=>change('guardian_phone',e.target.value)}/></label><label>Previous school<input value={registration.previous_school} onChange={e=>change('previous_school',e.target.value)}/></label></div>
          </>:<>
            <label>Parent / guardian full name<input required value={registration.full_name} onChange={e=>change('full_name',e.target.value)} autoComplete="name"/></label>
            <label>Your email address<input required type="email" value={registration.email} onChange={e=>change('email',e.target.value)} autoComplete="email"/></label>
            <label>Phone number<input required value={registration.phone} onChange={e=>change('phone',e.target.value)} autoComplete="tel"/></label>
            <label>Child’s student number<input required value={registration.student_number} onChange={e=>change('student_number',e.target.value)} placeholder="Use the student number issued by the school"/></label>
            <label>Relationship to learner<input required value={registration.relationship} onChange={e=>change('relationship',e.target.value)} placeholder="Parent, mother, father or guardian"/></label>
          </>}
        </>}
        <label>Create your private password<input required type="password" minLength="10" maxLength="128" value={registration.password} onChange={e=>change('password',e.target.value)} autoComplete="new-password"/><small>At least 10 characters. School staff cannot view your password.</small></label>
        {error&&<div role="alert" className="login-error"><ShieldCheck size={17}/><span>{error}</span></div>}
        <button className="school-join-submit" disabled={loading||schoolLoading||(role!=='headmaster'&&!school)||(role==='student'&&!classes.length)}>{loading?'Submitting securely…':role==='headmaster'?'Submit school for verification':role==='teacher'?'Send teacher application':role==='student'?'Send learner registration':'Create parent account & request child link'} <ArrowRight size={17}/></button>
        {role==='parent'&&<p className="school-join-terms">The school reviews the learner-link request before your child’s information becomes visible. A matching email alone never grants access.</p>}
        {role==='student'&&!classes.length&&<p className="school-join-no-classes">This school has not published its classes yet. Please contact the school office.</p>}
        <p className="school-join-terms">Your details are reviewed only by authorised school staff. Passwords remain private.</p>
      </form>}
      <div className="login-security-note"><ShieldCheck size={17}/><span>Existing accounts remain valid. Registration does not replace or duplicate an existing account.</span></div>
      <p className="login-help">If you cannot access your account, contact your school office. Never share your password with another person.</p>
    </div></main>
  </div>
}
