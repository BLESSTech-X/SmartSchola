import React, { useState, useEffect } from 'react'
import { ShieldCheck, Check, X, Edit2, Trash2, Tag } from 'lucide-react'
import { Modal, LoadingSpinner, EmptyState } from '../components/index'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

export default function AdminApprovals() {
  const [tab, setTab] = useState('pending')
  const [pending, setPending] = useState({ teachers: [], parents: [] })
  const [teachers, setTeachers] = useState([])
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({ classes_assigned: '', subjects_taught: '' })
  const [subjects, setSubjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const { addToast } = useToast()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pend, teach, par, sub] = await Promise.all([
        client.get('/admin/pending'), client.get('/admin/teachers'),
        client.get('/admin/parents'), client.get('/subjects')
      ])
      setPending(pend.data)
      setTeachers(teach.data || [])
      setParents(par.data || [])
      setSubjects(sub.data || [])
    } catch { addToast('Failed to load data', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const approve = async (userId) => {
    try {
      await client.post('/admin/approve', { user_id: userId, action: 'approve' })
      addToast('Approved!', 'success'); fetchAll()
    } catch { addToast('Failed to approve', 'error') }
  }

  const reject = async () => {
    if (!rejectReason.trim()) { addToast('Please provide a reason', 'warning'); return }
    setSaving(true)
    try {
      await client.post('/admin/approve', { user_id: rejectModal.user_id, action: 'reject', rejection_reason: rejectReason })
      addToast('Registration rejected', 'success'); setRejectModal(null); setRejectReason(''); fetchAll()
    } catch { addToast('Failed to reject', 'error') } finally { setSaving(false) }
  }

  const updateTeacher = async () => {
    setSaving(true)
    try {
      await client.put(`/admin/teacher/${editModal.user_id}`, { classes_assigned: editForm.classes_assigned, subjects_taught: editForm.subjects_taught })
      addToast('Teacher updated', 'success'); setEditModal(null); fetchAll()
    } catch { addToast('Failed to update', 'error') } finally { setSaving(false) }
  }

  const deleteUser = async () => {
    setSaving(true)
    try {
      await client.delete(`/admin/user/${deleteModal.user_id}`)
      addToast('User deleted', 'success'); setDeleteModal(null); fetchAll()
    } catch { addToast('Failed to delete', 'error') } finally { setSaving(false) }
  }

  const totalPending = pending.teachers.length + pending.parents.length

  const tabs = [
    { key: 'pending', label: 'Pending', badge: totalPending },
    { key: 'teachers', label: 'Teachers' },
    { key: 'parents', label: 'Parents' },
  ]

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <ShieldCheck size={28} className="text-gold" /> Approvals
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage teacher and parent registrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.key?'bg-white text-navy shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {t.badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner className="py-16" /> : (
        <>
          {/* Pending */}
          {tab === 'pending' && (
            <div className="space-y-6">
              {pending.teachers.length === 0 && pending.parents.length === 0 && (
                <EmptyState icon={<ShieldCheck size={32} />} title="No pending registrations" description="All caught up! New registrations will appear here." />
              )}
              {pending.teachers.length > 0 && (
                <div>
                  <h3 className="font-display text-navy font-semibold mb-3">Teacher Requests ({pending.teachers.length})</h3>
                  <div className="grid gap-3">
                    {pending.teachers.map(t => (
                      <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-navy">{t.full_name}</p>
                          <p className="text-gray-500 text-sm">@{t.username}{t.phone ? ` · ${t.phone}` : ''}</p>
                          {t.bio && <p className="text-gray-400 text-xs mt-2 italic">"{t.bio}"</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => approve(t.user_id)} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-all"><Check size={14} /> Approve</button>
                          <button onClick={() => setRejectModal(t)} className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"><X size={14} /> Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pending.parents.length > 0 && (
                <div>
                  <h3 className="font-display text-navy font-semibold mb-3">Parent Requests ({pending.parents.length})</h3>
                  <div className="grid gap-3">
                    {pending.parents.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-navy">{p.full_name}</p>
                          <p className="text-gray-500 text-sm">{p.phone} · {p.relationship}</p>
                          <p className="text-gray-400 text-xs mt-1">Child: <strong>{p.student_name}</strong> · Grade {p.student_grade} · {p.student_class}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => approve(p.user_id)} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-all"><Check size={14} /> Approve</button>
                          <button onClick={() => setRejectModal(p)} className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"><X size={14} /> Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Teachers */}
          {tab === 'teachers' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {teachers.length === 0 ? <EmptyState icon={<ShieldCheck size={32} />} title="No approved teachers" description="Approve teachers from the Pending tab" /> : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-navy text-white">
                    {['Name','Username','Classes','Actions'].map(h => <th key={h} className="text-left px-4 py-3.5 text-xs font-medium uppercase tracking-wide">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {teachers.map((t, i) => (
                      <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${i%2===0?'':'bg-gray-50/50'}`}>
                        <td className="px-4 py-3.5 font-medium text-navy">{t.full_name}</td>
                        <td className="px-4 py-3.5 text-gray-500">@{t.username}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {t.classes_assigned ? t.classes_assigned.split(',').filter(Boolean).map(c => <span key={c} className="bg-navy/10 text-navy px-2 py-0.5 rounded-md text-xs font-medium">{c.trim()}</span>) : <span className="text-gray-300 text-xs">None assigned</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => { setEditModal(t); setEditForm({ classes_assigned: t.classes_assigned, subjects_taught: t.subjects_taught }) }} className="p-1.5 text-gray-400 hover:text-navy hover:bg-navy/10 rounded-lg mr-1 transition-all"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteModal(t)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Parents */}
          {tab === 'parents' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {parents.length === 0 ? <EmptyState icon={<ShieldCheck size={32} />} title="No approved parents" description="Approve parents from the Pending tab" /> : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-navy text-white">
                    {['Name','Phone','Relationship','Child','Actions'].map(h => <th key={h} className="text-left px-4 py-3.5 text-xs font-medium uppercase tracking-wide">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {parents.map((p, i) => (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${i%2===0?'':'bg-gray-50/50'}`}>
                        <td className="px-4 py-3.5 font-medium text-navy">{p.full_name}</td>
                        <td className="px-4 py-3.5 text-gray-500">{p.phone}</td>
                        <td className="px-4 py-3.5 text-gray-500">{p.relationship}</td>
                        <td className="px-4 py-3.5 text-gray-700">{p.student_name}</td>
                        <td className="px-4 py-3.5"><button onClick={() => setDeleteModal(p)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason('') }} title="Reject Registration" size="sm">
        <p className="text-sm text-gray-600 mb-3">Rejecting: <strong>{rejectModal?.full_name}</strong></p>
        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 mb-4 resize-none" />
        <div className="flex gap-3">
          <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={reject} disabled={saving} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-60">{saving ? 'Rejecting...' : 'Reject'}</button>
        </div>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title={`Edit: ${editModal?.full_name}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Classes Assigned (comma-separated)</label>
            <input value={editForm.classes_assigned} onChange={e => setEditForm(f => ({...f, classes_assigned: e.target.value}))} placeholder="e.g. 7A,8B,9A" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Subjects Taught</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {subjects.map(s => {
                const selected = editForm.subjects_taught.split(',').map(x => x.trim()).includes(s.id.toString())
                return (
                  <label key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${selected ? 'border-navy bg-navy/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selected} onChange={() => {
                      const ids = editForm.subjects_taught.split(',').map(x => x.trim()).filter(Boolean)
                      const newIds = selected ? ids.filter(x => x !== s.id.toString()) : [...ids, s.id.toString()]
                      setEditForm(f => ({...f, subjects_taught: newIds.join(',')}))
                    }} className="accent-navy" />
                    <span className="text-sm text-gray-700">{s.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setEditModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={updateTeacher} disabled={saving} className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete User" size="sm">
        <p className="text-sm text-gray-600 mb-5">Permanently delete <strong>{deleteModal?.full_name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={deleteUser} disabled={saving} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-60">{saving ? 'Deleting...' : 'Delete User'}</button>
        </div>
      </Modal>
    </div>
  )
}
