import React, { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, Edit2, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal, EmptyState, LoadingSpinner } from '../components/index'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

const EMPTY_FORM = { first_name: '', last_name: '', grade: '', class_name: '', gender: '', date_of_birth: '', parent_phone: '', address: '' }

export default function Students() {
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/students', { params: { search, page, per_page: 20 } })
      setStudents(data.students || [])
      setTotal(data.total || 0)
    } catch { addToast('Failed to load students', 'error') }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { setPage(1) }, [search])

  const openAdd = () => { setForm(EMPTY_FORM); setSelected(null); setModal('add') }
  const openEdit = (s) => { setSelected(s); setForm({ first_name: s.first_name, last_name: s.last_name, grade: s.grade, class_name: s.class_name, gender: s.gender || '', date_of_birth: s.date_of_birth || '', parent_phone: s.parent_phone || '', address: s.address || '' }); setModal('edit') }
  const openDelete = (s) => { setSelected(s); setModal('delete') }

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.grade || !form.class_name) { addToast('First name, last name, grade and class are required', 'warning'); return }
    setSaving(true)
    try {
      if (modal === 'add') {
        await client.post('/students', { ...form, grade: parseInt(form.grade) })
        addToast('Student added successfully', 'success')
      } else {
        await client.put(`/students/${selected.id}`, { ...form, grade: parseInt(form.grade) })
        addToast('Student updated', 'success')
      }
      setModal(null); fetchStudents()
    } catch (err) { addToast(err.response?.data?.detail || 'Failed to save', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await client.delete(`/students/${selected.id}`)
      addToast('Student removed', 'success')
      setModal(null); fetchStudents()
    } catch { addToast('Failed to remove student', 'error') }
    finally { setSaving(false) }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-navy text-2xl lg:text-3xl font-bold">Students</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} enrolled student{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all">
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students by name..." className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : students.length === 0 ? (
          <EmptyState icon={<Users size={32} />} title="No students found" description={search ? 'Try a different search term' : 'Click "Add Student" to begin enrolling students'} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy text-white">
                    <th className="text-left px-5 py-3.5 font-medium text-xs uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3.5 font-medium text-xs uppercase tracking-wide">Grade</th>
                    <th className="text-left px-4 py-3.5 font-medium text-xs uppercase tracking-wide">Class</th>
                    <th className="text-left px-4 py-3.5 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Gender</th>
                    <th className="text-left px-4 py-3.5 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Parent Phone</th>
                    <th className="px-4 py-3.5 font-medium text-xs uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s, i) => (
                    <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-navy/10 rounded-full flex items-center justify-center text-navy font-bold text-xs flex-shrink-0">
                            {s.first_name[0]}{s.last_name[0]}
                          </div>
                          <span className="font-medium text-navy">{s.first_name} {s.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">Grade {s.grade}</td>
                      <td className="px-4 py-3.5"><span className="bg-navy/10 text-navy px-2 py-0.5 rounded-md text-xs font-medium">{s.class_name}</span></td>
                      <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">{s.gender || '—'}</td>
                      <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">{s.parent_phone || '—'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-navy hover:bg-navy/10 rounded-lg transition-all mr-1"><Edit2 size={14} /></button>
                        <button onClick={() => openDelete(s)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={16} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Student' : 'Edit Student'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[['first_name','First Name *','text'],['last_name','Last Name *','text'],['grade','Grade (1–12) *','number'],['class_name','Class Name *','text'],['gender','Gender','text'],['date_of_birth','Date of Birth','date'],['parent_phone','Parent Phone','tel']].map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
              {key === 'gender' ? (
                <select value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold">
                  <option value="">Select...</option>
                  <option>Male</option><option>Female</option>
                </select>
              ) : (
                <input type={type} value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
              )}
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Address</label>
            <textarea value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : modal === 'add' ? 'Add Student' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Remove Student" size="sm">
        <p className="text-gray-600 text-sm mb-1">Are you sure you want to remove <strong>{selected?.first_name} {selected?.last_name}</strong>?</p>
        <p className="text-gray-400 text-xs mb-5">Their marks and fee records will be preserved.</p>
        <div className="flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-60">
            {saving ? 'Removing...' : 'Remove Student'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
