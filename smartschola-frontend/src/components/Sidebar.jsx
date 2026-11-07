import { useState } from 'react'
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, ClipboardList, Award, Wallet, MessageSquare, Settings, LogOut, CalendarDays, GraduationCap, MoreHorizontal, X, Link2, UserRound, UserCog, Globe, ClipboardCheck, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const allLinks = [
 {to:'/workspace',icon:LayoutDashboard,label:'Dashboard',roles:['headmaster','admin','teacher','student','parent']},
 {to:'/workspace/students',icon:Users,label:'Students',roles:['headmaster','admin']},
 {to:'/workspace/admissions',icon:ClipboardCheck,label:'Admissions',roles:['headmaster','admin']},
 {to:'/workspace/teachers',icon:UserCog,label:'Teachers',roles:['headmaster','admin']},
 {to:'/workspace/student-access',icon:Link2,label:'Student & Parent Access',roles:['headmaster','admin']},
 {to:'/workspace/classes',icon:BookOpen,label:'Classes',roles:['headmaster','admin']},
 {to:'/workspace/academic-years',icon:CalendarDays,label:'Academic Years',roles:['headmaster','admin']},
 {to:'/workspace/marks',icon:ClipboardList,label:'Assessments & Marks',roles:['headmaster','admin','teacher']},
 {to:'/workspace/results',icon:Award,label:'Results',roles:['headmaster','admin','teacher']},
 {to:'/workspace/fees',icon:Wallet,label:'Fee Tracker',roles:['headmaster','admin']},
 {to:'/workspace/sms',icon:MessageSquare,label:'SMS Center',roles:['headmaster','admin']},
 {to:'/workspace/website',icon:Globe,label:'School Website',roles:['headmaster','admin']},
 {to:'/workspace/settings',icon:Settings,label:'Settings',roles:['headmaster','admin']},
 {to:'/workspace/profile',icon:UserRound,label:'My Profile',roles:['headmaster','admin','teacher','student','parent']}
]
const roleCaptions={headmaster:'Headmaster',admin:'School administrator',teacher:'Teacher',student:'Student',parent:'Parent / guardian'}
const avatar=(user)=>user?.avatar_data?<img src={user.avatar_data} alt=""/>:<span>{(user?.full_name||'U').slice(0,1).toUpperCase()}</span>
export default function Sidebar(){
 const{currentUser,logout}=useAuth(),navigate=useNavigate(),location=useLocation(),[moreOpen,setMoreOpen]=useState(false)
 const role=currentUser?.role||'headmaster',links=allLinks.filter(x=>x.roles.includes(role)),mobilePrimary=links.slice(0,4),mobileMore=links.slice(4)
 const isMoreActive=mobileMore.some(x=>location.pathname===x.to||location.pathname.startsWith(x.to+'/'))
 const handleLogout=()=>{logout();setMoreOpen(false);navigate('/login')}
 const navLinkClass=({isActive})=>`workspace-nav-link ${isActive?'active':''}`
 return <>
  <aside className="desktop-sidebar">
   <div className="workspace-brand"><div className="workspace-brand-mark"><GraduationCap size={23}/></div><div><h1>SmartSchola</h1><p>School Management</p></div></div>
   <Link to="/workspace/profile" className="workspace-sidebar-user">{currentUser?.avatar_data?<img className="workspace-sidebar-avatar-image" src={currentUser.avatar_data} alt=""/>:<span className="workspace-sidebar-avatar">{(currentUser?.full_name||'U').slice(0,1).toUpperCase()}</span>}<div><strong>{currentUser?.full_name||'School user'}</strong><small>{roleCaptions[role]||role}</small></div></Link>
   <div className="workspace-sidebar-section">WORKSPACE</div>
   <nav className="workspace-sidebar-nav" aria-label="Workspace navigation">{links.map(({to,icon:Icon,label})=><NavLink key={to} to={to} end={to==='/workspace'} className={navLinkClass}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
   <div className="workspace-sidebar-bottom"><div className="workspace-sidebar-school"><span className="workspace-school-dot"/><span>Your school workspace</span></div><button onClick={handleLogout} className="workspace-logout"><LogOut size={18}/>Sign out</button></div>
  </aside>
  <header className="mobile-app-header">
   <div className="mobile-brand"><div className="mobile-brand-mark"><GraduationCap size={21}/></div><div><div className="mobile-brand-name">SmartSchola</div><div className="mobile-brand-caption">{roleCaptions[role]||'School workspace'}</div></div></div>
   <div className="mobile-header-actions"><Link to="/workspace/profile" className="mobile-profile-link" aria-label="Open profile">{avatar(currentUser)}</Link><button type="button" className="mobile-header-menu" onClick={()=>setMoreOpen(v=>!v)} aria-label="Open workspace menu" aria-expanded={moreOpen}>{moreOpen?<X size={20}/>:<Menu size={20}/>}</button></div>
  </header>
  <nav className="mobile-bottom-nav" aria-label="Main navigation">{mobilePrimary.map(({to,icon:Icon,label})=><NavLink key={to} to={to} end={to==='/workspace'} className={({isActive})=>`mobile-nav-item ${isActive?'active':''}`}><Icon size={20}/><span>{label==='Assessments & Marks'?'Marks':label}</span></NavLink>)}<button type="button" className={`mobile-nav-item ${isMoreActive||moreOpen?'active':''}`} onClick={()=>setMoreOpen(v=>!v)} aria-expanded={moreOpen}><MoreHorizontal size={20}/><span>More</span></button></nav>
  {moreOpen&&<button aria-label="Close navigation menu" className="mobile-menu-backdrop" onClick={()=>setMoreOpen(false)}/>}
  <div className={`mobile-more-panel ${moreOpen?'open':''}`} aria-hidden={!moreOpen}><div className="mobile-more-heading"><span>Workspace menu</span><button onClick={()=>setMoreOpen(false)} aria-label="Close menu"><X size={19}/></button></div>{mobileMore.map(({to,icon:Icon,label})=><NavLink key={to} to={to} onClick={()=>setMoreOpen(false)} className={({isActive})=>`mobile-more-link ${isActive?'active':''}`}><span className="mobile-more-icon"><Icon size={18}/></span><span>{label}</span><span className="mobile-more-arrow">›</span></NavLink>)}<button className="mobile-more-link mobile-logout" onClick={handleLogout}><span className="mobile-more-icon"><LogOut size={18}/></span><span>Sign out</span><span className="mobile-more-arrow">›</span></button></div>
 </>
}
