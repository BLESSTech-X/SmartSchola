import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link2, Users, ShieldCheck, RefreshCw, Search, UserRound, GraduationCap } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function StudentAccess() {
  const { currentUser } = useAuth()
  const { addToast } = useToast()
  const schoolId = currentUser?.school_id
  const canManage = ['headmaster', 'admin'].includes(currentUser?.role)
  const [students, setStudents] = useState([])
  const [studentAccounts, setStudentAccounts] = useState([])
  const [parentAccounts, setParentAccounts] = useState([])
  const [studentLinks, setStudentLinks] = useState([])
  const [parentLinks, setParentLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('student')
  const [search, setSearch] = useState('')
  const [studentId, setStudentId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [relationship, setRelationship] = useState('Parent')
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'student' })
  const [inviting, setInviting] = useState(false)

  const load = useCallback(async () => {
    if (!schoolId || !supabase) { setLoading(false); return }
    setLoading(true)
    try {
      const [studentResult, membershipResult, studentLinkResult, parentLinkResult] = await Promise.all([
        supabase.from('students').select('id,student_number,first_name,last_name,grade,class_name,class_id').eq('school_id', schoolId).eq('status', 'active').order('last_name').limit(1000),
        supabase.from('school_memberships').select('id,user_id,role,status,login_identifier').eq('school_id', schoolId).in('role', ['student','parent']).eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('student_account_links').select('id,student_id,user_id,created_at').eq('school_id', schoolId),
        supabase.from('parent_student_links').select('id,student_id,parent_user_id,relationship,status,created_at').eq('school_id', schoolId),
      ])
      for (const result of [studentResult, membershipResult, studentLinkResult, parentLinkResult]) if (result.error) throw result.error
      setStudents(studentResult.data || [])
      setStudentAccounts((membershipResult.data || []).filter(m => m.role === 'student'))
      setParentAccounts((membershipResult.data || []).filter(m => m.role === 'parent'))
      setStudentLinks(studentLinkResult.data || [])
      setParentLinks(parentLinkResult.data || [])
    } catch (error) {
      addToast(error.message || 'Could not load account links', 'error')
    } finally { setLoading(false) }
  }, [schoolId, addToast])

  useEffect(() => { load() }, [load])

  const accounts = tab === 'student' ? studentAccounts : parentAccounts
  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return students
    return students.filter(s => [s.first_name, s.last_name, s.student_number, s.class_name].some(v => String(v || '').toLowerCase().includes(term)))
  }, [students, search])

  const linkedUserIds = tab === 'student'
    ? studentLinks.filter(l => l.student_id === studentId).map(l => l.user_id)
    : parentLinks.filter(l => l.student_id === studentId && l.status === 'approved').map(l => l.parent_user_id)

  const submitLink = async event => {
    event.preventDefault()
    if (!canManage) return
    if (!studentId || !accountId) { addToast('Choose a student and an active account first.', 'warning'); return }
    setSaving(true)
    try {
      const rpc = tab === 'student'
        ? supabase.rpc('link_student_account', { target_school: schoolId, target_student: studentId, target_user: accountId })
        : supabase.rpc('link_parent_to_student', { target_school: schoolId, target_student: studentId, target_parent_user: accountId, target_relationship: relationship })
      const { error } = await rpc
      if (error) throw error
      addToast(tab === 'student' ? 'Student account linked successfully.' : 'Parent relationship verified and linked.', 'success')
      setAccountId('')
      await load()
    } catch (error) { addToast(error.message || 'Could not save account link', 'error') }
    finally { setSaving(false) }
  }

  const labelAccount = account => account.login_identifier || `Account · ${account.user_id.slice(0, 8)}…`\n\n  const createPortalAccount = async event => {\n    event.preventDefault()\n    if (!canManage || !schoolId) return\n    setInviting(true)\n    try {\n      const { data, error } = await supabase.functions.invoke('provision-portal-account', {\n        body: { school_id: schoolId, full_name: inviteForm.full_name.trim(), email: inviteForm.email.trim(), role: inviteForm.role },\n      })\n      if (error) throw error\n      if (data?.error) throw new Error(data.error)\n      addToast(data?.message || 'Invitation sent successfully.', 'success')\n      setInviteForm({ full_name: '', email: '', role: 'student' })\n      await load()\n    } catch (error) { addToast(error.message || 'Could not invite this account. Check that the invitation service is deployed.', 'error') }\n    finally { setInviting(false) }\n  }
  const studentName = id => { const s = students.find(row => row.id === id); return s ? `${s.first_name} ${s.last_name} · ${s.student_number}` : 'Student record' }

  if (!canManage) return <div className="p-6"><PageHeader title="Student & Parent Access" subtitle="Account linking is restricted to school leadership."/><div className="bg-white border border-amber-200 rounded-2xl p-5 text-sm text-gray-600"><ShieldCheck className="inline mr-2 text-amber-600" size={18}/>Only the headmaster or an administrator can verify student and parent account links.</div></div>

  return <div className="p-6">
    <PageHeader title="Student & Parent Access" subtitle="Connect existing school accounts to learner records. Only verified links grant portal access." action={<button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50"><RefreshCw size={15}/> Refresh</button>}/>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-4"><div className="text-xs text-gray-500">Active learner records</div><div className="text-2xl font-bold text-slate-900 mt-1">{students.length}</div></div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4"><div className="text-xs text-gray-500">Linked student accounts</div><div className="text-2xl font-bold text-slate-900 mt-1">{studentLinks.length}</div></div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4"><div className="text-xs text-gray-500">Verified parent links</div><div className="text-2xl font-bold text-slate-900 mt-1">{parentLinks.filter(l => l.status === 'approved').length}</div></div>
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
      <div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><UserRound size={20}/></div><div><h2 className="font-bold text-slate-900">Create a student or parent account</h2><p className="text-sm text-gray-500 mt-1">Send a secure email invitation. The recipient creates their own password.</p></div></div>
      <form onSubmit={createPortalAccount} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        <label className="text-xs font-semibold text-gray-600">Full name<input required maxLength={160} value={inviteForm.full_name} onChange={e=>setInviteForm(v=>({...v,full_name:e.target.value}))} placeholder="Learner or parent full name" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-normal"/></label>
        <label className="text-xs font-semibold text-gray-600">Email address<input required type="email" maxLength={254} value={inviteForm.email} onChange={e=>setInviteForm(v=>({...v,email:e.target.value}))} placeholder="person@example.com" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-normal"/></label>
        <label className="text-xs font-semibold text-gray-600">Account type<select value={inviteForm.role} onChange={e=>setInviteForm(v=>({...v,role:e.target.value}))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-normal"><option value="student">Student</option><option value="parent">Parent / guardian</option></select></label>
        <div className="flex items-end"><button disabled={inviting || !inviteForm.full_name.trim() || !inviteForm.email.trim()} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{background:'#0B1D3A'}}>{inviting?'Sending invitation…':'Send secure invitation'}</button></div>
      </form>
      <p className="mt-3 text-xs text-gray-500">Only headmasters and administrators can send invitations. The account receives access only to this school and must be linked to a learner record before learner-specific information is available.</p>
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
        <button onClick={() => {setTab('student');setAccountId('')}} className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${tab==='student'?'bg-slate-900 text-white':'bg-gray-100 text-gray-600'}`}><GraduationCap size={16}/> Student accounts</button>
        <button onClick={() => {setTab('parent');setAccountId('')}} className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${tab==='parent'?'bg-slate-900 text-white':'bg-gray-100 text-gray-600'}`}><Users size={16}/> Parent / guardian links</button>
      </div>
      <div className="p-5">
        <div className="max-w-2xl">
          <h2 className="font-bold text-slate-900">{tab==='student'?'Link a student login':'Verify a parent or guardian'}</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4">{tab==='student'?'Connect an active student account to exactly one learner record.':'Confirm the parent account belongs to this learner. Approved parents can view the linked learner’s published information.'}</p>
          {loading ? <div className="py-10 flex justify-center"><LoadingSpinner size={28}/></div> : <>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Find learner</label>
            <div className="relative mb-3"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, student number or class" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm"/></div>
            <form onSubmit={submitLink} className="space-y-3">
              <select required value={studentId} onChange={e=>{setStudentId(e.target.value);setAccountId('')}} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm">
                <option value="">Select learner record</option>
                {filteredStudents.map(s=><option key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.student_number} · Grade {s.grade}</option>)}
              </select>
              <label className="block text-xs font-semibold text-gray-500">{tab==='student'?'Active student account':'Active parent / guardian account'}</label>
              <select required value={accountId} onChange={e=>setAccountId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm">
                <option value="">Select existing school account</option>
                {accounts.filter(a=>!linkedUserIds.includes(a.user_id)).map(a=><option key={a.id} value={a.user_id}>{labelAccount(a)}</option>)}
              </select>
              {tab==='parent' && <label className="block text-xs font-semibold text-gray-500">Relationship<input value={relationship} onChange={e=>setRelationship(e.target.value)} required minLength={2} maxLength={40} placeholder="Parent, mother, father, guardian" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"/></label>}
              <button disabled={saving || !studentId || !accountId} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{background:'#0B1D3A'}}><Link2 size={16}/>{saving?'Saving securely…':tab==='student'?'Link student account':'Verify & link parent'}</button>
            </form>
            <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 leading-relaxed"><ShieldCheck size={15} className="inline mr-1"/>Only active accounts with the matching school role appear here. Verify the person's identity and authority before linking. A parent link is approved immediately by this action.</div>
          </>}
        </div>
      </div>
    </div>
    <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-bold text-slate-900 mb-3">Existing verified links</h3>
      {loading ? <LoadingSpinner size={22}/> : <div className="space-y-2">
        {studentLinks.map(link=><div key={link.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-gray-100 pb-2"><span><GraduationCap size={15} className="inline mr-2 text-gray-400"/>{studentName(link.student_id)}</span><span className="text-gray-500">Student · {link.user_id.slice(0,8)}…</span></div>)}
        {parentLinks.filter(link=>link.status==='approved').map(link=><div key={link.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-gray-100 pb-2"><span><UserRound size={15} className="inline mr-2 text-gray-400"/>{studentName(link.student_id)}</span><span className="text-gray-500">{link.relationship} · {link.parent_user_id.slice(0,8)}…</span></div>)}
        {!studentLinks.length && !parentLinks.some(link=>link.status==='approved') && <p className="text-sm text-gray-500">No verified account links yet.</p>}
      </div>}
    </div>
  </div>
}
