import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, DollarSign, AlertCircle, MessageSquare, Clock, UserPlus, BookOpen, CreditCard, Zap } from 'lucide-react'
import { StatCard, LoadingSpinner } from '../components/index'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()

  useEffect(() => {
    client.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="p-6 lg:p-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-navy text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="text-navy font-medium">{currentUser?.full_name}</span></p>
      </div>

      {/* Pending approval banner */}
      {stats?.pending_approvals > 0 && currentUser?.role === 'admin' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium text-sm">{stats.pending_approvals} pending registration{stats.pending_approvals !== 1 ? 's' : ''} awaiting your approval</p>
          </div>
          <Link to="/approvals" className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-600 transition-all flex-shrink-0">Review</Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users size={20} className="text-white" />} label="Total Students" value={stats?.total_students ?? 0} color="navy" />
        <StatCard icon={<DollarSign size={20} className="text-green-600" />} label="Fees Collected" value={`K ${(stats?.fees_collected ?? 0).toFixed(2)}`} color="green" />
        <StatCard icon={<AlertCircle size={20} className="text-red-500" />} label="Outstanding Fees" value={`K ${(stats?.fees_outstanding ?? 0).toFixed(2)}`} color="red" />
        <StatCard icon={<MessageSquare size={20} className="text-blue-600" />} label="SMS Sent Today" value={stats?.sms_sent_today ?? 0} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-display text-navy text-lg font-semibold mb-4 flex items-center gap-2"><Clock size={18} className="text-gold" /> Recent Activity</h2>
          {stats?.recent_activity?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_activity.map((a, i) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gold rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{a.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No activity yet. Start by adding students.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-display text-navy text-lg font-semibold mb-4 flex items-center gap-2"><Zap size={18} className="text-gold" /> Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/students" className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy/5 transition-all group">
              <div className="w-9 h-9 bg-navy/10 rounded-lg flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all"><UserPlus size={16} className="text-navy group-hover:text-white" /></div>
              <div><p className="text-sm font-medium text-navy">Add Student</p><p className="text-xs text-gray-400">Enrol a new student</p></div>
            </Link>
            <Link to="/marks" className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy/5 transition-all group">
              <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center group-hover:bg-gold transition-all"><BookOpen size={16} className="text-gold" /></div>
              <div><p className="text-sm font-medium text-navy">Enter Marks</p><p className="text-xs text-gray-400">Record exam scores</p></div>
            </Link>
            {currentUser?.role === 'admin' && (
              <>
                <Link to="/fees" className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy/5 transition-all group">
                  <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-all"><CreditCard size={16} className="text-green-600 group-hover:text-white" /></div>
                  <div><p className="text-sm font-medium text-navy">Record Payment</p><p className="text-xs text-gray-400">Update fee records</p></div>
                </Link>
                <Link to="/sms" className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy/5 transition-all group">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-all"><MessageSquare size={16} className="text-blue-600 group-hover:text-white" /></div>
                  <div><p className="text-sm font-medium text-navy">Send SMS</p><p className="text-xs text-gray-400">Message parents</p></div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
