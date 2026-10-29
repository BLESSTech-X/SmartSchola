import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2, Search, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { listClasses, listAcademicYears, saveClass, removeClass } from '../lib/classRecords.js'

export default function Classes() {
  const { currentUser } = useAuth()
  const { addToast } = useToast()
  const schoolId = currentUser?.school_id
  const [classes, setClasses] = useState([])
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', academic_year_id: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    if (!schoolId) { setClasses([]); setYears([]); setLoading(false); return }
    setLoading(true)
    try {
      const [classRows, yearRows] = await Promise.all([listClasses(schoolId), listAcademicYears(schoolId)])
      setClasses(classRows)
      setYears(yearRows)
    } catch (error) { addToast(error.message || 'Could not load classes', 'error') }
    finally { setLoading(false) }
  }, [schoolId, addToast])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm({ name: '', academic_year_id: years.find(y => y.is_current)?.id || '' }); setModalOpen(true) }
  const openEdit = row => { setEditing(row); setForm({ name: row.name, academic_year_id: row.academic_year_id || '' }); setModalOpen(true) }
  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Enter a class name', 'warning'); return }
    setSaving(true)
    try {
      await saveClass({ schoolId, classId: editing?.id, name: form.name, academicYearId: form.academic_year_id })
      addToast(editing ? 'Class updated' : 'Class created', 'success')
      setModalOpen(false)
      await load()
    } catch (error) { addToast(error.message || 'Could not save class', 'error') }
    finally { setSaving(false) }
  }
  const handleDelete = async row => {
    if (!window.confirm(`Delete "${row.name}"? Students assigned to this class will remain in the student register, but their class link will be cleared.`)) return
    setDeleting(row.id)
    try { await removeClass({ schoolId, classId: row.id }); addToast('Class deleted', 'success'); await load() }
    catch (error) { addToast(error.message || 'Could not delete class', 'error') }
    finally { setDeleting(null) }
  }
  const filtered = classes.filter(row => row.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6">
      <PageHeader title="Classes" subtitle={`${classes.length} classes in your school`} action={
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: '#0B1D3A' }}><Plus size={16}/> Add Class</button>
      } />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative w-full max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"/></div>
          <span className="text-xs text-gray-400">School data is isolated to your account</span>
        </div>
        {loading ? <div className="py-20 flex justify-center"><LoadingSpinner size={30}/></div> :
          filtered.length === 0 ? <EmptyState icon={BookOpen} title={search ? 'No matching classes' : 'No classes created yet'} description={search ? 'Try another class name.' : 'Create classes to organise learners by grade, stream or section.'} actionLabel={search ? undefined : 'Add Class'} onAction={search ? undefined : openCreate}/> :
          <div className="divide-y divide-gray-50">{filtered.map(row => <div key={row.id} className="px-5 py-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#EEF3FA', color: '#214A82' }}><BookOpen size={20}/></div>
            <div className="min-w-0 flex-1"><p className="font-semibold text-sm text-gray-800">{row.name}</p><p className="text-xs text-gray-400 mt-1">{row.academic_years?.name || 'No academic year assigned'}</p></div>
            <div className="flex items-center gap-2"><button onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={16}/></button><button onClick={() => handleDelete(row)} disabled={deleting === row.id} aria-label={`Delete ${row.name}`} className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50">{deleting === row.id ? <LoadingSpinner size={15}/> : <Trash2 size={16}/>}</button></div>
          </div>)}</div>}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class' : 'Create Class'} size="md">
        <div className="space-y-4">
          <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Class name</label><input autoFocus value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} placeholder="e.g. Grade 8A, Form 2 East" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"/></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Academic year</label><select value={form.academic_year_id} onChange={e => setForm(v => ({ ...v, academic_year_id: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none"><option value="">No academic year</option>{years.map(year => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' · Current' : ''}</option>)}</select>{years.length === 0 && <p className="text-xs text-gray-400 mt-1">You can assign an academic year after creating one in Settings.</p>}</div>
        </div>
        <div className="flex justify-end gap-3 mt-6"><button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Cancel</button><button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#0B1D3A' }}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Class'}</button></div>
      </Modal>
    </div>
  )
}
