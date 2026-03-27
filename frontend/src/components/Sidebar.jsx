import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, BarChart3,
  CreditCard, MessageSquare, Settings, LogOut,
  GraduationCap, ShieldCheck, Menu, X, Bell
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Sidebar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      client.get('/admin/stats').then(r => {
        setPendingCount(r.data.total_pending || 0)
      }).catch(() => {})
      const interval = setInterval(() => {
        client.get('/admin/stats').then(r => setPendingCount(r.data.total_pending || 0)).catch(() => {})
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const adminLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/students', icon: <Users size={18} />, label: 'Students' },
    { to: '/marks', icon: <BookOpen size={18} />, label: 'Mark Entry' },
    { to: '/results', icon: <BarChart3 size={18} />, label: 'Results' },
    { to: '/fees', icon: <CreditCard size={18} />, label: 'Fee Tracker' },
    { to: '/sms', icon: <MessageSquare size={18} />, label: 'SMS Center' },
    {
      to: '/approvals',
      icon: <ShieldCheck size={18} />,
      label: 'Approvals',
      badge: pendingCount,
    },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
  ]

  const teacherLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/students', icon: <Users size={18} />, label: 'Students' },
    { to: '/marks', icon: <BookOpen size={18} />, label: 'Mark Entry' },
    { to: '/results', icon: <BarChart3 size={18} />, label: 'Results' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
  ]

  const links = currentUser?.role === 'admin' ? adminLinks : teacherLinks

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-navy-400">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} className="text-navy" />
          </div>
          <div>
            <h1 className="font-display text-white text-base font-bold leading-tight">Smart Schola</h1>
            <p className="text-navy-200 text-xs">Pro</p>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div className="px-4 py-3 border-b border-navy-400">
        <div className="bg-navy-400 rounded-lg px-3 py-2">
          <p className="text-white text-sm font-medium truncate">{currentUser?.full_name}</p>
          <p className="text-gold text-xs capitalize">{currentUser?.role}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'active bg-gold/18 text-gold font-medium'
                  : 'text-navy-100 hover:text-white'
              }`
            }
          >
            <span className="flex-shrink-0">{link.icon}</span>
            <span className="flex-1">{link.label}</span>
            {link.badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse flex-shrink-0">
                {link.badge > 9 ? '9+' : link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-navy text-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-navy z-50 lg:hidden transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-navy-200 hover:text-white"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-navy h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  )
}
