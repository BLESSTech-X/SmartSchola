import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, Wallet, MessageSquare, Plus, ClipboardList, CalendarDays, Sparkles, ChevronRight, ArrowUpRight, Clock3 } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import { apiRequest } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { TeacherDashboard, StudentDashboard, ParentDashboard } from './RoleDashboards.jsx'

const money = value => `K${Number(value || 0).toLocaleString('en-ZM',{minimumFractionDigits:2,maximumFractionDigits:2})}`

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState(0)
  const [classes, setClasses] = useState(0)
  const [currentYear, setCurrentYear] = useState(null)
  const [fees, setFees] = useState(null)
  const [smsToday, setSmsToday] = useState(null)
  const [messages, setMessages] = useState([])
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { currentUser } = useAuth()
  const role = currentUser?.role

  useEffect(() => {
    if (role === 'teacher' || role === 'student' || role === 'parent') return
    let active = true
    const load = async () => {
      const [studentResult, classResult, yearResult, feeResult, smsResult] = await Promise.allSettled([
        apiRequest('/api/students'),
        apiRequest('/api/classes'),
        apiRequest('/api/academic-years'),
        apiRequest('/api/fees?page=1&per_page=1'),
        apiRequest('/api/sms/log?per_page=100')
      ])
      if (!active) return
      let coreFailures = 0
      if (studentResult.status === 'fulfilled') setStudents((studentResult.value.students || []).filter(item => item.status === 'active').length)
      else coreFailures++
      if (classResult.status === 'fulfilled') setClasses((classResult.value.classes || []).length)
      else coreFailures++
      if (yearResult.status === 'fulfilled') setCurrentYear((yearResult.value.academic_years || []).find(item => item.is_current) || null)
      else coreFailures++
      if (feeResult.status === 'fulfilled') setFees(feeResult.value.summary || null)
      if (smsResult.status === 'fulfilled') {
        const logs = smsResult.value.logs || []
        setMessages(logs.slice(0,5))
        const today = new Date().toLocaleDateString('en-CA')
        setSmsToday(logs.filter(item => item.status === 'sent' && item.sent_at && new Date(item.sent_at).toLocaleDateString('en-CA') === today).length)
      }
      if (coreFailures === 3) addToast('The school overview could not load. Please refresh or check your connection.', 'error')
      setLoading(false)
    }
    load().catch(error => { if (active) { addToast(error.message || 'Could not load the school overview.', 'error'); setLoading(false) } })
    return () => { active = false }
  }, [role])

  if (role === 'teacher') return <TeacherDashboard/>
  if (role === 'student') return <StudentDashboard/>
  if (role === 'parent') return <ParentDashboard/>

  const quickActions = [
    { label: 'Add a student', detail: 'Register a learner profile', icon: Plus, path: '/workspace/students', tone: 'navy' },
    { label: 'Enter marks', detail: 'Record assessment scores', icon: ClipboardList, path: '/workspace/marks', tone: 'green' },
    { label: 'Record a payment', detail: 'Manage school fee records', icon: Wallet, path: '/workspace/fees', tone: 'blue' },
    { label: 'Send a message', detail: 'Communicate with parents', icon: MessageSquare, path: '/workspace/sms', tone: 'purple' },
  ]

  return <div className="dashboard-page">
    <div className="dashboard-welcome">
      <div><div className="eyebrow"><Sparkles size={13}/> SCHOOL OVERVIEW</div><h1>Good to see you, {(currentUser?.full_name || currentUser?.name || 'School leader').split(' ')[0]}.</h1><p>Your school's key numbers and the actions that need your attention.</p></div>
      <div className="dashboard-date"><CalendarDays size={16}/><span>{new Date().toLocaleDateString('en-ZM',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span></div>
    </div>

    <div className="dashboard-stat-grid">
      <StatCard loading={loading} icon={Users} label="Active students" value={students.toLocaleString()} sub="Currently enrolled learners" color="#214A82"/>
      <StatCard loading={loading} icon={Wallet} label="Fees collected" value={fees ? money(fees.total_collected) : '—'} sub={fees ? 'Recorded payments' : 'Fee summary unavailable'} color="#16866B"/>
      <StatCard loading={loading} icon={Wallet} label="Outstanding fees" value={fees ? money(fees.outstanding) : '—'} sub={fees ? 'Remaining invoice balances' : 'Fee summary unavailable'} color="#C65B42"/>
      <StatCard loading={loading} icon={MessageSquare} label="SMS sent today" value={smsToday === null ? '—' : smsToday.toLocaleString()} sub={smsToday === null ? 'Message summary unavailable' : 'Successfully sent messages'} color="#7655B5"/>
    </div>

    <section className="dashboard-overview-strip">
      <button type="button" onClick={() => navigate('/workspace/academic-years')} className="dashboard-overview-card">
        <span className="dashboard-overview-icon gold"><CalendarDays size={20}/></span><span className="dashboard-overview-copy"><small>Current academic year</small><strong>{loading ? 'Loading…' : currentYear?.name || 'Not set'}</strong><em>{currentYear ? [currentYear.starts_on,currentYear.ends_on].filter(Boolean).join(' – ') || 'Dates not set' : 'Set the active school year'}</em></span><ArrowUpRight size={18}/>
      </button>
      <button type="button" onClick={() => navigate('/workspace/classes')} className="dashboard-overview-card">
        <span className="dashboard-overview-icon blue"><BookOpen size={20}/></span><span className="dashboard-overview-copy"><small>Classes and streams</small><strong>{loading ? 'Loading…' : classes.toLocaleString()}</strong><em>Manage class and year assignments</em></span><ArrowUpRight size={18}/>
      </button>
    </section>

    <div className="dashboard-content-grid">
      <section className="dashboard-panel quick-panel">
        <div className="section-heading"><div><h2>Quick actions</h2><p>Important school tasks, one click away</p></div></div>
        <div className="quick-action-list">{quickActions.map(({label,detail,icon:Icon,path,tone})=><button key={label} className="quick-action" onClick={()=>navigate(path)}><span className={`quick-action-icon ${tone}`}><Icon size={19}/></span><span className="quick-action-copy"><strong>{label}</strong><small>{detail}</small></span><ChevronRight className="quick-action-arrow" size={17}/></button>)}</div>
      </section>
      <section className="dashboard-panel activity-panel">
        <div className="section-heading"><div><h2>Latest messages</h2><p>Recent SMS communication from your school</p></div><button className="dashboard-text-link" onClick={()=>navigate('/workspace/sms')}>Open SMS center <ArrowUpRight size={14}/></button></div>
        {loading ? <div className="activity-loading"><span/><span/><span/></div> : messages.length ? <div className="dashboard-message-list">{messages.map(message=><article className="dashboard-message" key={message.id}><span className="dashboard-message-icon"><MessageSquare size={16}/></span><div><strong>{message.recipient_name || message.recipient_phone || 'Recipient'}</strong><p>{message.message}</p><small><Clock3 size={12}/>{message.sent_at ? new Date(message.sent_at).toLocaleString('en-ZM',{dateStyle:'medium',timeStyle:'short'}) : 'Time unavailable'}</small></div><em className={message.status === 'sent' ? 'sent' : 'failed'}>{message.status || 'Unknown'}</em></article>)}</div> : <div className="dashboard-no-messages"><MessageSquare size={23}/><strong>No messages to show yet</strong><span>Messages sent through the SMS center will appear here.</span></div>}
      </section>
    </div>
  </div>
}
