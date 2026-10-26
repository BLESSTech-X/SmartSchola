import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Wallet, AlertCircle, MessageSquare, Plus, ClipboardList, LayoutDashboard, ArrowUpRight, CalendarDays, Sparkles, ChevronRight } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import client from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

const formatK = (n) => `K ${(n || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`
const formatDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : ''

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { addToast } = useToast()

  useEffect(() => {
    client.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => addToast('Could not load dashboard data', 'error'))
      .finally(() => setLoading(false))
  }, [])

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
        <StatCard loading={loading} icon={Wallet} label="Fees collected" value={loading ? '—' : formatK(stats?.fees_collected)} sub="This academic year" color="#16866B" />
        <StatCard loading={loading} icon={AlertCircle} label="Outstanding fees" value={loading ? '—' : formatK(stats?.fees_outstanding)} sub="Balance to follow up" color="#C65B42" />
        <StatCard loading={loading} icon={MessageSquare} label="SMS sent today" value={stats?.sms_sent_today ?? '—'} sub="Messages sent" color="#7655B5" />
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
            <div className="activity-list">
              {(stats?.recent_activity || []).map(item => (
                <div key={item.id} className="activity-item">
                  <span className="activity-dot"/>
                  <div className="activity-copy"><p>{item.action}</p>{item.details && <small>{item.details}</small>}</div>
                  <time>{formatDate(item.created_at)}</time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
