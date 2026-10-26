import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, Award, Wallet, MessageSquare, Settings, LogOut, GraduationCap, MoreHorizontal, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/workspace', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workspace/students', icon: Users, label: 'Students' },
  { to: '/workspace/marks', icon: ClipboardList, label: 'Mark Entry' },
  { to: '/workspace/results', icon: Award, label: 'Results' },
  { to: '/workspace/fees', icon: Wallet, label: 'Fee Tracker' },
  { to: '/workspace/sms', icon: MessageSquare, label: 'SMS Center' },
  { to: '/workspace/settings', icon: Settings, label: 'Settings' },
]
const mobilePrimary = links.slice(0, 4)
const mobileMore = links.slice(4)

export default function Sidebar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const isMoreActive = mobileMore.some(link => location.pathname === link.to || location.pathname.startsWith(link.to + '/'))

  const handleLogout = () => {
    logout()
    setMoreOpen(false)
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive ? 'text-navy font-semibold' : 'text-white/65 hover:text-white hover:bg-white/5'}`

  return (
    <>
      <aside className="desktop-sidebar w-64 flex-shrink-0 flex flex-col" style={{ background: '#0B1D3A' }}>
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: '#F5A623' }}>
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-none">SmartSchola</h1>
              <p className="text-white/45 text-xs mt-1">School Management</p>
            </div>
          </div>
        </div>
        {currentUser && (
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#F5A623', color: '#0B1D3A' }}>
                {(currentUser.full_name || currentUser.name || 'Admin')[0]}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{currentUser.full_name || currentUser.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: 'rgba(245,166,35,0.2)', color: '#F5A623' }}>{currentUser.role}</span>
              </div>
            </div>
          </div>
        )}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}
              style={({ isActive }) => isActive ? { background: '#F5A623', color: '#0B1D3A' } : {}}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:text-red-300 hover:bg-red-500/10 transition-all">
            <LogOut size={18} />Logout
          </button>
        </div>
      </aside>

      <header className="mobile-app-header">
        <div className="mobile-brand">
          <div className="mobile-brand-mark"><GraduationCap size={21} /></div>
          <div><div className="mobile-brand-name">SmartSchola</div><div className="mobile-brand-caption">School management</div></div>
        </div>
        <div className="mobile-user-chip" title={currentUser?.full_name || currentUser?.name || 'Administrator'}>
          <span className="mobile-user-avatar">{(currentUser?.full_name || currentUser?.name || 'Admin')[0]}</span>
          <span className="mobile-user-name">{currentUser?.full_name || currentUser?.name || 'Administrator'}</span>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        {mobilePrimary.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} strokeWidth={2} /><span>{label === 'Mark Entry' ? 'Marks' : label}</span>
          </NavLink>
        ))}
        <button type="button" className={`mobile-nav-item ${isMoreActive || moreOpen ? 'active' : ''}`} onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen}>
          {moreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}<span>More</span>
        </button>
      </nav>

      {moreOpen && <button aria-label="Close navigation menu" className="mobile-menu-backdrop" onClick={() => setMoreOpen(false)} />}
      <div className={`mobile-more-panel ${moreOpen ? 'open' : ''}`} aria-hidden={!moreOpen}>
        <div className="mobile-more-heading"><span>More tools</span><button onClick={() => setMoreOpen(false)} aria-label="Close menu"><X size={19}/></button></div>
        {mobileMore.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setMoreOpen(false)} className={({ isActive }) => `mobile-more-link ${isActive ? 'active' : ''}`}>
            <span className="mobile-more-icon"><Icon size={18}/></span><span>{label}</span><span className="mobile-more-arrow">›</span>
          </NavLink>
        ))}
        <button className="mobile-more-link mobile-logout" onClick={handleLogout}><span className="mobile-more-icon"><LogOut size={18}/></span><span>Log out</span><span className="mobile-more-arrow">›</span></button>
        <div className="mobile-demo-note">Your school workspace</div>
      </div>
    </>
  )
}
