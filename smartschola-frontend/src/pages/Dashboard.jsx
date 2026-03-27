import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Wallet, AlertCircle, MessageSquare, Plus, ClipboardList, LayoutDashboard } from 'lucide-react'
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
    { label: 'Add Student', icon: Plus, path: '/students', color: '#0B1D3A' },
    { label: 'Enter Marks', icon: ClipboardList, path: '/marks', color: '#059669' },
    { label: 'Record Payment', icon: Wallet, path: '/fees', color: '#0284C7' },
    { label: 'Send SMS', icon: MessageSquare, path: '/sms', color: '#7C3AED' },
  ]

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle="Welcome to Smart Schola" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard loading={loading} icon={Users} label="Total Students" value={stats?.total_students ?? '—'} sub="Active enrolled" color="#0B1D3A" />
        <StatCard loading={loading} icon={Wallet} label="Fees Collected" value={loading ? '—' : formatK(stats?.fees_collected)} sub="This year" color="#059669" />
        <StatCard loading={loading} icon={AlertCircle} label="Outstanding Fees" value={loading ? '—' : formatK(stats?.fees_outstanding)} sub="Balance due" color="#DC2626" />
        <StatCard loading={loading} icon={MessageSquare} label="SMS Sent Today" value={stats?.sms_sent_today ?? '—'} sub="Messages" color="#7C3AED" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-base mb-4" style={{ color: '#0B1D3A' }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, icon: Icon, path, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-xs font-medium text-gray-600">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-base mb-4" style={{ color: '#0B1D3A' }}>Recent Activity</h2>
          {!loading && (!stats?.recent_activity || stats.recent_activity.length === 0) ? (
            <EmptyState icon={LayoutDashboard} title="No activity yet" description="Actions will appear here as you use the system." />
          ) : (
            <div className="space-y-2">
              {(stats?.recent_activity || []).map(item => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#F5A623' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{item.action}</p>
                    {item.details && <p className="text-xs text-gray-400">{item.details}</p>}
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0">{formatDate(item.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
