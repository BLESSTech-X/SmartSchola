import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, BookOpen, CalendarDays, CheckCircle2, ClipboardList, GraduationCap, Link2, MessageCircle, Users } from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function DashboardHeading({ eyebrow, title, description }) {
  return <div className="role-dashboard-heading"><div><span className="role-dashboard-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><span className="role-dashboard-date"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-ZM',{weekday:'short',day:'numeric',month:'short'})}</span></div>
}

function Metric({ icon: Icon, label, value, detail, tone = 'blue' }) {
  return <article className="role-metric-card"><span className={`role-metric-icon ${tone}`}><Icon size={20}/></span><div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div></article>
}

function DashboardLink({ to, icon: Icon, title, detail }) {
  return <Link to={to} className="role-action-link"><span><Icon size={19}/></span><div><strong>{title}</strong><small>{detail}</small></div><b>→</b></Link>
}

export function TeacherDashboard() {
  const { currentUser } = useAuth()
  const { addToast } = useToast()
  const [data, setData] = useState({ classes: [], students: [], assessments: [], attendance: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest('/api/classes'),
      apiRequest('/api/students'),
      apiRequest('/api/assessments'),
      apiRequest('/api/attendance/sessions')
    ]).then(([classes, students, assessments, attendance]) => {
      if (!active) return
      setData({
        classes: classes.classes || [],
        students: students.students || [],
        assessments: assessments.assessments || [],
        attendance: attendance.sessions || []
      })
    }).catch(error => { if (active) addToast(error.message || 'Teaching overview could not be loaded.', 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const recentAssessments = [...data.assessments].sort((a,b) => String(b.assessment_date || b.created_at || '').localeCompare(String(a.assessment_date || a.created_at || ''))).slice(0,4)
  return <div className="role-dashboard">
    <DashboardHeading eyebrow="TEACHING WORKSPACE" title={`Welcome, ${(currentUser?.full_name || currentUser?.name || 'Teacher').split(' ')[0]}.`} description="Your teaching overview, assigned classes and assessment activity."/>
    <div className="role-metric-grid">
      <Metric icon={BookOpen} label="Assigned classes" value={loading ? '—' : data.classes.length} detail="Classes linked to your account"/>
      <Metric icon={Users} label="Your learners" value={loading ? '—' : data.students.length} detail="Learners in assigned classes" tone="gold"/>
      <Metric icon={ClipboardList} label="Assessments" value={loading ? '—' : data.assessments.length} detail="Available class assessments" tone="purple"/>
      <Metric icon={CheckCircle2} label="Attendance sessions" value={loading ? '—' : data.attendance.length} detail="Sessions recorded for your classes" tone="green"/>
    </div>
    <div className="role-dashboard-columns">
      <section className="role-dashboard-panel"><div className="role-panel-heading"><div><h2>Teaching tools</h2><p>Continue with your most common tasks</p></div></div><div className="role-action-list">
        <DashboardLink to="/workspace/marks" icon={ClipboardList} title="Assessments & mark entry" detail="Create assessments and record learner scores"/>
        <DashboardLink to="/workspace/results" icon={Award} title="Academic results" detail="Review published learner performance"/>
      </div></section>
      <section className="role-dashboard-panel"><div className="role-panel-heading"><div><h2>Recent assessments</h2><p>Your latest class assessment records</p></div><Link to="/workspace/marks">Open marks →</Link></div>
        {loading ? <p className="role-muted">Loading assessments…</p> : recentAssessments.length ? <div className="role-record-list">{recentAssessments.map(item => <div className="role-record" key={item.id}><span className="role-record-icon"><ClipboardList size={17}/></span><div><strong>{item.name}</strong><small>{item.subject || 'Subject not set'} · {item.assessment_date || 'Date not set'}</small></div><em className={`role-status ${item.status === 'published' ? 'success' : 'pending'}`}>{item.status || 'Draft'}</em></div>)}</div> : <div className="role-empty"><ClipboardList size={22}/><strong>No assessments yet</strong><span>Assessments for your assigned classes will appear here.</span></div>}
      </section>
    </div>
  </div>
}

export function StudentDashboard() {
  const { currentUser } = useAuth()
  const { addToast } = useToast()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/api/student/me').then(result => { if (active) setStudent(result.student || null) })
      .catch(err => { if (active) { setError(err.message || 'Your learner profile could not be loaded.'); addToast(err.message || 'Your learner profile could not be loaded.', 'error') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const fullName = student ? [student.first_name, student.last_name].filter(Boolean).join(' ') : currentUser?.full_name || 'Student'
  return <div className="role-dashboard">
    <DashboardHeading eyebrow="STUDENT PORTAL" title={`Hello, ${fullName.split(' ')[0]}.`} description="Your personal school space. Keep track of your learner information and stay connected with your school."/>
    {error ? <div className="role-alert" role="alert">{error} If this continues, please contact your school administrator.</div> : null}
    <section className="role-profile-card"><div className="role-profile-mark"><GraduationCap size={28}/></div><div className="role-profile-copy"><span>YOUR LEARNER PROFILE</span><h2>{loading ? 'Loading your profile…' : fullName}</h2><p>{student?.student_number ? `Student number: ${student.student_number}` : 'Your school-linked learner information'}</p></div><span className="role-profile-state">{student?.status || (loading ? 'Loading' : 'Active')}</span></section>
    <div className="role-metric-grid role-student-metrics">
      <Metric icon={BookOpen} label="Class" value={loading ? '—' : student?.class_name || 'Not assigned'} detail="Your current class"/>
      <Metric icon={Award} label="Grade" value={loading ? '—' : student?.grade || '—'} detail="Your school grade" tone="gold"/>
      <Metric icon={Users} label="School" value={loading ? '—' : currentUser?.school_name || 'Your school'} detail="Your learning community" tone="purple"/>
    </div>
    <section className="role-dashboard-panel role-information-panel"><div className="role-panel-heading"><div><h2>Your academic information</h2><p>What you can access through this portal</p></div></div><div className="role-info-note"><Award size={19}/><p>Your school manages the publication of results and other academic records. Contact your teacher or school office if you need help accessing a report.</p></div></section>
  </div>
}

export function ParentDashboard() {
  const { currentUser } = useAuth()
  const { addToast } = useToast()
  const [children, setChildren] = useState([])
  const [studentNumber, setStudentNumber] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest('/api/parent/children').then(result => { if (active) setChildren(result.children || []) })
      .catch(error => { if (active) addToast(error.message || 'Linked learner information could not be loaded.', 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const requestLink = async event => {
    event.preventDefault()
    if (!studentNumber.trim()) return
    setSending(true)
    try {
      const result = await apiRequest('/api/parent/link-requests', { method: 'POST', body: JSON.stringify({ student_number: studentNumber.trim(), relationship }) })
      addToast(result.message || 'Your learner link request has been submitted.', 'success')
      setStudentNumber('')
    } catch (error) { addToast(error.message || 'Could not submit the link request.', 'error') }
    finally { setSending(false) }
  }

  return <div className="role-dashboard">
    <DashboardHeading eyebrow="PARENT PORTAL" title={`Welcome, ${(currentUser?.full_name || currentUser?.name || 'Parent').split(' ')[0]}.`} description="Stay connected to your child's school journey and learner information."/>
    <div className="role-metric-grid role-parent-metrics"><Metric icon={GraduationCap} label="Linked learners" value={loading ? '—' : children.length} detail="Approved learner connections"/><Metric icon={MessageCircle} label="School connection" value="Active" detail="Your school manages link approvals" tone="gold"/></div>
    <div className="role-dashboard-columns">
      <section className="role-dashboard-panel"><div className="role-panel-heading"><div><h2>Your children</h2><p>Approved learner connections</p></div></div>
        {loading ? <p className="role-muted">Loading linked learners…</p> : children.length ? <div className="role-child-list">{children.map(child => <article className="role-child-card" key={child.id}><span className="role-child-avatar"><GraduationCap size={20}/></span><div><strong>{child.first_name} {child.last_name}</strong><small>{child.student_number} · {child.grade || 'Grade not set'} · {child.class_name || 'Class not set'}</small><em>{child.relationship || 'Parent'}</em></div></article>)}</div> : <div className="role-empty"><Users size={23}/><strong>No learners linked yet</strong><span>Use the secure request form to connect your account to a learner.</span></div>}
      </section>
      <section className="role-dashboard-panel"><div className="role-panel-heading"><div><h2>Connect a learner</h2><p>Use the student number provided by the school</p></div><span className="role-form-icon"><Link2 size={18}/></span></div>
        <form className="role-link-form" onSubmit={requestLink}><label>Student number<input value={studentNumber} onChange={event => setStudentNumber(event.target.value)} placeholder="Enter student number" required autoComplete="off"/></label><label>Relationship<select value={relationship} onChange={event => setRelationship(event.target.value)}><option value="parent">Parent</option><option value="mother">Mother</option><option value="father">Father</option><option value="guardian">Guardian</option></select></label><button type="submit" disabled={sending || !studentNumber.trim()}>{sending ? 'Submitting request…' : 'Request learner connection'}</button><small>The school must review and approve the request before learner details become visible.</small></form>
      </section>
    </div>
  </div>
}
