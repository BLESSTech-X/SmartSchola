import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, Award, Wallet, MessageSquare, Settings, LogOut, GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/marks', icon: ClipboardList, label: 'Mark Entry' },
  { to: '/results', icon: Award, label: 'Results' },
  { to: '/fees', icon: Wallet, label: 'Fee Tracker' },
  { to: '/sms', icon: MessageSquare, label: 'SMS Center' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#0B1D3A' }}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#F5A623' }}>
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-none">Smart Schola</h1>
            <p className="text-white/40 text-xs mt-0.5">School Management</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {currentUser && (
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#F5A623', color: '#0B1D3A' }}>
              {currentUser.full_name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser.full_name}</p>
              <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: 'rgba(245,166,35,0.2)', color: '#F5A623' }}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-navy font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: '#F5A623', color: '#0B1D3A' } : {}}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}
