import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Wallet, AlertCircle, MessageSquare, Plus, ClipboardList, LayoutDashboard, ArrowUpRight, CalendarDays, Sparkles, ChevronRight } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'


export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { currentUser } = useAuth()
  const schoolId = currentUser?.school_id

  useEffect(() => {
    let active = true
    if (!schoolId || !supabase) {
      setStats({ total_students: 0, recent_activity: [] })
      setLoading(false)
      if (!schoolId) addToast('Your account is not linked to a school. Please sign in again.', 'error')
      return () => { active = false }
    }
    supabase.from('students').select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId).eq('status', 'active')
      .then(({ count, error }) => {
        if (!active) return
        if (error) throw error
        setStats({ total_students: count || 0, recent_activity: [] })
      })
      .catch(err => { if (active) addToast(err.message || 'Could not load the school dashboard', 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [schoolId])

  const quickActions = [
    { label: 'Add student', detail: 'Create a student profile', icon: Plus, path: '/workspace/students', tone: 'navy' },
    { label: 'Enter marks', detail: 'Update assessment scores', icon: ClipboardList, path: '/workspace/marks', tone: 'green' },
    { label: 'Record payment', detail: 'Track school fees', icon: Wallet, path: '/workspace/fees', tone: 'blue' },
    { label: 'Send SMS', detail: 'Contact parents', icon: MessageSquare, path: '/workspace/sms', tone: 'purple' },
  ]

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <div className="eyebrow"><Sparkles size={13}/> SCHOOL OVERVIEW</div>
          <h1>Good to see you.</h1>
          <p>Here’s what’s happening with your school today.</p>
        </div>
        <div className="dashboard-date"><CalendarDays size={16}/><span>{new Date().toLocaleDateString('en-ZM',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span></div>
      </div>

      <div className="dashboard-stat-grid">
        <StatCard loading={loading} icon={Users} label="Total students" value={stats?.total_students ?? '—'} sub="Currently enrolled" color="#214A82" />
        <StatCard loading={loading} icon={Wallet} label="Fees collected" value="Not connected" sub="Fees module migration pending" color="#16866B" />
        <StatCard loading={loading} icon={AlertCircle} label="Outstanding fees" value="Not connected" sub="Fees module migration pending" color="#C65B42" />
        <StatCard loading={loading} icon={MessageSquare} label="SMS sent today" value="Not connected" sub="Communications module migration pending" color="#7655B5" />
      </div>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel quick-panel">
          <div className="section-heading">
            <div><h2>Quick actions</h2><p>Common tasks, one tap away</p></div>
          </div>
          <div className="quick-action-list">
            {quickActions.map(({ label, detail, icon: Icon, path, tone }) => (
              <button key={label} className="quick-action" onClick={() => navigate(path)}>
                <span className={`quick-action-icon ${tone}`}><Icon size={19}/></span>
                <span className="quick-action-copy"><strong>{label}</strong><small>{detail}</small></span>
                <ChevronRight className="quick-action-arrow" size={17}/>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-panel activity-panel">
          <div className="section-heading">
            <div><h2>Recent activity</h2><p>A snapshot of recent system activity</p></div>
            <span className="live-indicator"><span/> Latest</span>
          </div>
          {!loading && (!stats?.recent_activity || stats.recent_activity.length === 0) ? (
            <EmptyState icon={LayoutDashboard} title="No activity yet" description="Activity will appear here as you use the system." />
          ) : loading ? (
            <div className="activity-loading"><span/><span/><span/></div>
          ) : (
            <EmptyState icon={LayoutDashboard} title="Activity tracking is being connected" description="Recent school actions will appear here when the activity module is migrated to Supabase." />>
          )}
        </section>
      </div>
    </div>
  )
}
