import { useCallback, useEffect, useState } from 'react'
import { Activity, Building2, CheckCircle2, Clock3, GraduationCap, LogOut, RefreshCw, ShieldCheck, Users, XCircle } from 'lucide-react'
import { apiRequest } from '../lib/api.js'

const initialMetrics = { schools_total: 0, schools_pending: 0, schools_verified: 0, schools_suspended: 0, students_total: 0, teachers_total: 0, parents_total: 0, school_admins_total: 0, classes_total: 0 }
const metricCards = [
  { key: 'schools_total', label: 'Registered schools', icon: Building2 },
  { key: 'schools_pending', label: 'Awaiting review', icon: Clock3 },
  { key: 'students_total', label: 'Active learners', icon: GraduationCap },
  { key: 'teachers_total', label: 'Active teachers', icon: Users },
  { key: 'schools_verified', label: 'Verified schools', icon: CheckCircle2 },
  { key: 'schools_suspended', label: 'Suspended schools', icon: XCircle },
]
const dateLabel = value => value ? new Date(value).toLocaleDateString() : '—'

export default function PlatformAdmin() {
  const [sessionUser, setSessionUser] = useState(null)
  const [grant, setGrant] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [metrics, setMetrics] = useState(initialMetrics)
  const [schools, setSchools] = useState([])
  const [audit, setAudit] = useState([])
  const [tab, setTab] = useState('overview')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadAccess = useCallback(async (token) => {
    if (!token) { setSessionUser(null); setGrant(null); setLoading(false); return null }
    const user = await apiRequest('/api/platform/auth/me', { token })
    const [stats, schoolRows, auditRows] = await Promise.all([
      apiRequest('/api/platform/metrics', { token }),
      apiRequest('/api/platform/schools', { token }),
      apiRequest('/api/platform/audit', { token })
    ])
    setSessionUser(user)
    setGrant({ role: user.role, status: 'active' })
    setMetrics({ ...initialMetrics, ...(stats.metrics || {}) })
    setSchools(schoolRows.schools || [])
    setAudit(auditRows.audit || [])
    setLoading(false)
    return user
  }, [])

  useEffect(() => {
    let active = true
    const token = sessionStorage.getItem('platform_token')
    if (!token) { setLoading(false); return }
    loadAccess(token).catch(err => {
      if (!active) return
      sessionStorage.removeItem('platform_token')
      setError(err.message || 'Could not verify platform access.')
      setLoading(false)
    })
    return () => { active = false }
  }, [loadAccess])

  const signIn = async event => {
    event.preventDefault()
    setError(''); setNotice(''); setBusy(true)
    try {
      const data = await apiRequest('/api/platform/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) })
      sessionStorage.setItem('platform_token', data.access_token)
      await loadAccess(data.access_token)
      setPassword('')
    } catch (err) { setError(err.message || 'Platform sign-in failed.') }
    finally { setBusy(false) }
  }

  const refresh = async () => {
    setLoading(true); setError('')
    try { await loadAccess(sessionStorage.getItem('platform_token')) }
    catch (err) { setError(err.message || 'Refresh failed.') }
    finally { setLoading(false) }
  }

  const changeSchoolStatus = async (school, status) => {
    const verb = status === 'verified' ? 'verify' : 'suspend'
    if (!window.confirm(`Are you sure you want to ${verb} ${school.name}?`)) return
    setBusyId(school.id); setError(''); setNotice('')
    try {
      await apiRequest(`/api/platform/schools/${school.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token: sessionStorage.getItem('platform_token') })
      setNotice('School status updated.')
      await refresh()
    } catch (err) { setError(err.message || 'Could not update school status.') }
    finally { setBusyId('') }
  }

  const signOut = async () => {
    const token = sessionStorage.getItem('platform_token')
    if (token) apiRequest('/api/auth/logout', { method: 'POST', token }).catch(() => {})
    sessionStorage.removeItem('platform_token')
    setSessionUser(null); setGrant(null); setSchools([]); setAudit([]); setMetrics(initialMetrics)
  }
  const visibleSchools = schools.filter(s => filter === 'all' || s.status === filter)

  if (loading) return <div className="min-h-screen bg-slate-50 grid place-items-center text-slate-500">Loading secure platform workspace…</div>

  if (!grant) return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><section className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-7">
    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center mb-5"><GraduationCap size={25}/></div>
    <p className="text-xs tracking-[.18em] font-bold text-amber-700">SMARTSCHOLA · PLATFORM CONTROL</p>
    <h1 className="text-2xl font-bold text-slate-900 mt-2">Platform administrator sign in</h1>
    <p className="text-sm text-slate-500 mt-2 mb-6">This is a separate control area. A school membership does not grant platform privileges.</p>
    {sessionUser ? <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900">This signed-in account does not have an active platform administrator grant. Sign out and use an authorised platform account.</div> : <form onSubmit={signIn} className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">Administrator email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" autoComplete="username"/></label>
      <label className="block text-sm font-semibold text-slate-700">Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" autoComplete="current-password"/></label>
      <button disabled={busy} className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold disabled:opacity-50">{busy ? 'Verifying access…' : 'Sign in securely'}</button>
    </form>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <a href="/SmartSchola/" className="block text-center text-sm text-slate-500 mt-6 hover:text-slate-900">Return to SmartSchola</a>
  </section></main>

  return <div className="min-h-screen bg-slate-100 text-slate-900">
    <header className="bg-[#0B1D3A] text-white border-b border-white/10"><div className="max-w-[1600px] mx-auto px-5 lg:px-8 py-5 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 grid place-items-center"><GraduationCap size={24}/></div><div><p className="text-xs tracking-[.2em] text-amber-300 font-bold">SMARTSCHOLA</p><h1 className="text-xl font-bold">Platform Command Centre</h1></div></div><div className="flex items-center gap-3"><span className="hidden sm:block text-right"><strong className="block text-sm">{sessionUser?.email}</strong><small className="text-slate-300 capitalize">{grant.role} access</small></span><button onClick={refresh} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15" title="Refresh"><RefreshCw size={18}/></button><button onClick={signOut} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15" title="Sign out"><LogOut size={18}/></button></div></div></header>
    <main className="max-w-[1600px] mx-auto px-5 lg:px-8 py-7">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6"><div><p className="text-xs uppercase tracking-[.18em] text-amber-700 font-bold">Platform operations</p><h2 className="text-3xl font-bold mt-1">Good to see you.</h2><p className="text-slate-500 mt-1">A live overview of schools and activity across SmartSchola.</p></div><span className="text-xs text-slate-500 flex items-center gap-2"><Activity size={15}/> Live database figures · refresh to update</span></div>
      {error && <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      {notice && <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{notice}</div>}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-7">{metricCards.map(({key,label,icon:Icon})=><section key={key} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="flex justify-between items-center text-slate-500 text-sm"><span>{label}</span><Icon size={18}/></div><p className="text-3xl font-bold mt-3 tabular-nums">{Number(metrics[key] || 0).toLocaleString()}</p></section>)}</div>
      <div className="flex gap-2 border-b border-slate-200 mb-5"><button onClick={()=>setTab('overview')} className={`px-4 py-3 text-sm font-semibold border-b-2 ${tab==='overview'?'border-amber-500 text-slate-900':'border-transparent text-slate-500'}`}>Overview</button><button onClick={()=>setTab('schools')} className={`px-4 py-3 text-sm font-semibold border-b-2 ${tab==='schools'?'border-amber-500 text-slate-900':'border-transparent text-slate-500'}`}>Schools ({schools.length})</button><button onClick={()=>setTab('audit')} className={`px-4 py-3 text-sm font-semibold border-b-2 ${tab==='audit'?'border-amber-500 text-slate-900':'border-transparent text-slate-500'}`}>Audit trail</button></div>
      {tab==='overview' && <div className="grid xl:grid-cols-[1.4fr_1fr] gap-5"><section className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex justify-between items-center mb-4"><div><h3 className="font-bold text-lg">School pipeline</h3><p className="text-sm text-slate-500">Registration and verification status</p></div><button onClick={()=>setTab('schools')} className="text-sm font-semibold text-amber-700">Manage schools →</button></div><div className="grid grid-cols-3 gap-2">{[['Pending',metrics.schools_pending,'bg-amber-50 text-amber-800'],['Verified',metrics.schools_verified,'bg-emerald-50 text-emerald-800'],['Suspended',metrics.schools_suspended,'bg-rose-50 text-rose-800']].map(([label,value,cls])=><div key={label} className={`rounded-xl p-4 ${cls}`}><p className="text-xs font-semibold">{label}</p><p className="text-2xl font-bold mt-1">{Number(value).toLocaleString()}</p></div>)}</div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-500">Active parents</span><strong className="block text-xl mt-1">{Number(metrics.parents_total).toLocaleString()}</strong></div><div className="p-3 bg-slate-50 rounded-xl"><span className="text-slate-500">School leaders</span><strong className="block text-xl mt-1">{Number(metrics.school_admins_total).toLocaleString()}</strong></div></div></section><section className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-bold text-lg mb-1">Latest privileged activity</h3><p className="text-sm text-slate-500 mb-4">Recorded platform actions</p>{audit.length ? audit.slice(0,6).map(item=><div key={item.id} className="py-3 border-b last:border-0 border-slate-100"><p className="text-sm font-semibold">{item.action.replaceAll('.',' ')}</p><p className="text-xs text-slate-500 mt-1">{item.details?.school_name || item.target_type} · {dateLabel(item.created_at)}</p></div>) : <p className="text-sm text-slate-500 py-6">No platform actions recorded yet.</p>}</section></div>}
      {tab==='schools' && <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">School directory</h3><p className="text-xs text-slate-500">Platform-wide registration and verification controls</p></div><select value={filter} onChange={e=>setFilter(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm"><option value="all">All schools</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="suspended">Suspended</option></select></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">School</th><th className="p-4">Location</th><th className="p-4">Status</th><th className="p-4">Registered</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{visibleSchools.map(s=><tr key={s.id} className="border-t border-slate-100"><td className="p-4"><strong>{s.name}</strong><small className="block text-slate-500">/{s.slug}</small></td><td className="p-4 text-slate-600">{s.location || '—'}</td><td className="p-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${s.status==='verified'?'bg-emerald-50 text-emerald-700':s.status==='suspended'?'bg-rose-50 text-rose-700':'bg-amber-50 text-amber-800'}`}>{s.status}</span></td><td className="p-4 text-slate-600">{dateLabel(s.created_at)}</td><td className="p-4 text-right">{grant.role!=='support' && <div className="flex justify-end gap-2">{s.status!=='verified' && <button disabled={busyId===s.id} onClick={()=>changeSchoolStatus(s,'verified')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">Verify</button>}{s.status!=='suspended' && <button disabled={busyId===s.id} onClick={()=>changeSchoolStatus(s,'suspended')} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold disabled:opacity-50">Suspend</button>}</div>}</td></tr>)}</tbody></table>{!visibleSchools.length && <p className="p-8 text-center text-sm text-slate-500">No schools match this filter.</p>}</div></section>}
      {tab==='audit' && <section className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-bold text-lg">Platform audit trail</h3><p className="text-sm text-slate-500 mb-4">Privileged changes are recorded with actor, target, action and timestamp.</p>{audit.length ? audit.map(item=><div key={item.id} className="py-3 border-b last:border-0 border-slate-100 flex justify-between gap-4"><div><p className="text-sm font-semibold">{item.action}</p><p className="text-xs text-slate-500 mt-1">{item.details?.school_name || item.target_type}</p></div><time className="text-xs text-slate-500 whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</time></div>) : <p className="text-sm text-slate-500">No audit entries yet.</p>}</section>}
      <p className="text-xs text-slate-500 mt-7 flex items-center gap-2"><ShieldCheck size={15}/> Platform privileges are separate from school memberships. Student-level records are not exposed in this dashboard.</p>
    </main>
  </div>
}
