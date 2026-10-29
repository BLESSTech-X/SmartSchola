import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen as BookOpenIcon, Wallet, AlertCircle, MessageSquare, Plus, ClipboardList, LayoutDashboard, ArrowUpRight, CalendarDays, Sparkles, ChevronRight } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'


export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [academicOverview, setAcademicOverview] = useState({ currentYear: null, totalClasses: 0 })
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
    Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId).eq('status', 'active'),
      supabase.from('classes').select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId),
      supabase.from('academic_years').select('id,name,starts_on,ends_on,is_current')
        .eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    ])
      .then(([studentsResult, classesResult, yearResult]) => {
        if (!active) return
        if (studentsResult.error) throw studentsResult.error
        if (classesResult.error) throw classesResult.error
        if (yearResult.error) throw yearResult.error
        setStats({ total_students: studentsResult.count || 0, recent_activity: [] })
        setAcademicOverview({ currentYear: yearResult.data || null, totalClasses: classesResult.count || 0 })
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

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <button type="button" onClick={() => navigate('/workspace/academic-years')} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-amber-200 hover:shadow-md">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><CalendarDays size={21}/></span><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current academic year</p><p className="mt-1 font-semibold text-gray-900">{loading ? 'Loading…' : academicOverview.currentYear?.name || 'Not set'}</p><p className="mt-1 text-xs text-gray-500">{academicOverview.currentYear ? [academicOverview.currentYear.starts_on, academicOverview.currentYear.ends_on].filter(Boolean).join(' to ') || 'Dates not set' : 'Set the active school year'}</p></div></div>
          <ArrowUpRight size={18} className="shrink-0 text-gray-400"/>
        </button>
        <button type="button" onClick={() => navigate('/workspace/classes')} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpenIcon/></span><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Classes and streams</p><p className="mt-1 font-semibold text-gray-900">{loading ? 'Loading…' : academicOverview.totalClasses}</p><p className="mt-1 text-xs text-gray-500">Manage classes and academic-year assignments</p></div></div>
          <ArrowUpRight size={18} className="shrink-0 text-gray-400"/>
        </button>
      </section>

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
            <EmptyState icon={LayoutDashboard} title="Activity tracking is being connected" description="Recent school actions will appear here when the activity module is migrated to Supabase." />
          ) : loading ? (
            <div className="activity-loading"><span/><span/><span/></div>
          ) : (
            <EmptyState icon={LayoutDashboard} title="Activity tracking is being connected" description="Recent school actions will appear here when the activity module is migrated to Supabase." />
          )}
        </section>
      </div>
    </div>
  )
}
