import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Pencil, Trash2, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import client from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

const EMPTY_FORM = { first_name:'', last_name:'', grade:'', class_name:'', date_of_birth:'', gender:'', parent_phone:'', address:'' }

export default function Students() {
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [editStudent, setEditStudent] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  const fetchStudents = useCallback(() => {
    setLoading(true)
    client.get('/students', { params: { search: search || undefined, page, per_page: 20 } })
      .then(r => { setStudents(r.data.students); setTotal(r.data.total) })
      .catch(() => addToast('Failed to load students', 'error'))
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const openAdd = () => { setEditStudent(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (s) => {
    setEditStudent(s)
    setForm({ first_name: s.first_name, last_name: s.last_name, grade: s.grade, class_name: s.class_name, date_of_birth: s.date_of_birth||'', gender: s.gender||'', parent_phone: s.parent_phone||'', address: s.address||'' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.grade || !form.class_name) {
      addToast('First name, last name, grade, and class are required', 'warning'); return
    }
    setSaving(true)
    try {
      if (editStudent) {
        await client.put(`/students/${editStudent.id}`, form)
        addToast('Student updated successfully', 'success')
      } else {
        await client.post('/students', form)
        addToast('Student added successfully', 'success')
      }
      setModalOpen(false)
      fetchStudents()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await client.delete(`/students/${deleteModal.id}`)
      addToast('Student removed', 'success')
      setDeleteModal(null)
      fetchStudents()
    } catch { addToast('Delete failed', 'error') }
    finally { setDeleting(false) }
  }

  const pages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="p-6">
      <PageHeader
        title="Students"
        subtitle={`${total} total students`}
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: '#0B1D3A' }}>
            <Plus size={16} /> Add Student
          </button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><LoadingSpinner size={32} /></div>
        ) : students.length === 0 ? (
          <EmptyState icon={Users} title="No students yet" description="Add your first student to get started." actionLabel="Add Student" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Grade', 'Class', 'Parent Phone', 'Gender', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#0B1D3A' }}>
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{s.first_name} {s.last_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">Grade {s.grade}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.class_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.parent_phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.gender || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteModal(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Showing {(page-1)*20+1}–{Math.min(page*20, total)} of {total}</p>
                <div className="flex gap-1">
                  <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 rounded text-xs font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
                  <button disabled={page===pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1 rounded text-xs font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editStudent ? 'Edit Student' : 'Add New Student'} size="md">
        <div className="grid grid-cols-2 gap-4">
          {[['first_name','First Name','text',true],['last_name','Last Name','text',true]].map(([field,label,type,req]) => (
            <div key={field}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label} {req && <span className="text-red-400">*</span>}</label>
              <input type={type} value={form[field]} onChange={e => setForm(p=>({...p,[field]:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Grade <span className="text-red-400">*</span></label>
            <select value={form.grade} onChange={e => setForm(p=>({...p,grade:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400">
              <option value="">Select grade</option>
              {[...Array(12)].map((_,i) => <option key={i+1} value={i+1}>Grade {i+1}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Class Name <span className="text-red-400">*</span></label>
            <input type="text" placeholder="e.g. 7A, 9B" value={form.class_name} onChange={e => setForm(p=>({...p,class_name:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Gender</label>
            <select value={form.gender} onChange={e => setForm(p=>({...p,gender:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none">
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Date of Birth</label>
            <input type="date" value={form.date_of_birth} onChange={e => setForm(p=>({...p,date_of_birth:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Parent Phone <span className="text-gray-300 font-normal">(+260...)</span></label>
            <input type="tel" placeholder="+260 9X XXX XXXX" value={form.parent_phone} onChange={e => setForm(p=>({...p,parent_phone:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Address <span className="text-gray-300 font-normal">(optional)</span></label>
            <input type="text" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 disabled:opacity-60" style={{ background: '#0B1D3A' }}>
            {saving && <LoadingSpinner size={14} color="white" />}{saving ? 'Saving...' : editStudent ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Remove Student" size="sm">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to remove <strong>{deleteModal?.first_name} {deleteModal?.last_name}</strong>? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 flex items-center gap-2 disabled:opacity-60">
            {deleting && <LoadingSpinner size={14} color="white" />}{deleting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
