import { useState, useEffect, useCallback } from 'react'
import { Wallet, Plus, Pencil, Trash2, Bell, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import client from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

const statusBadge = (s) => {
  if (s === 'Paid') return 'bg-emerald-100 text-emerald-700'
  if (s === 'Partial') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}
const K = (n) => `K ${(n||0).toFixed(2)}`
const EMPTY_FORM = { student_id:'', term:'', year:new Date().getFullYear(), amount_due:'', amount_paid:'0', payment_date:'', payment_method:'Cash', notes:'' }

export default function FeeTracker() {
  const [fees, setFees] = useState([])
  const [summary, setSummary] = useState({ total_due:0, total_collected:0, outstanding:0, student_count:0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editFee, setEditFee] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [allStudents, setAllStudents] = useState([])
  const [saving, setSaving] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const { addToast } = useToast()

  const fetchFees = useCallback(() => {
    setLoading(true)
    client.get('/fees', { params: { search: search||undefined, page, per_page:20 } })
      .then(r => { setFees(r.data.fees); setTotal(r.data.total); setSummary(r.data.summary) })
      .catch(() => addToast('Failed to load fees','error'))
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { fetchFees() }, [fetchFees])

  useEffect(() => {
    client.get('/students', { params: { per_page:200 } }).then(r => setAllStudents(r.data.students)).catch(()=>{})
  }, [])

  const filteredStudents = allStudents.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 8)

  const openAdd = () => { setEditFee(null); setForm(EMPTY_FORM); setStudentSearch(''); setModalOpen(true) }
  const openEdit = (f) => {
    setEditFee(f)
    setForm({ student_id: f.student_id, term: f.term, year: f.year, amount_due: f.amount_due, amount_paid: f.amount_paid, payment_date: f.payment_date||'', payment_method: f.payment_method||'Cash', notes: f.notes||'' })
    setStudentSearch(f.student_name||'')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.student_id || !form.term || !form.amount_due) { addToast('Student, term and amount due are required','warning'); return }
    setSaving(true)
    try {
      if (editFee) { await client.put(`/fees/${editFee.id}`, form); addToast('Fee updated','success') }
      else { await client.post('/fees', form); addToast('Fee record added','success') }
      setModalOpen(false); fetchFees()
    } catch (err) { addToast(err.response?.data?.detail||'Save failed','error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this fee record?')) return
    try { await client.delete(`/fees/${id}`); addToast('Deleted','success'); fetchFees() }
    catch { addToast('Delete failed','error') }
  }

  const sendReminders = async () => {
    setSendingReminders(true)
    try {
      const r = await client.post('/fees/send-reminders')
      addToast(`Reminders sent: ${r.data.sent} delivered, ${r.data.failed} failed`, r.data.failed > 0 ? 'warning' : 'success')
    } catch { addToast('Failed to send reminders','error') }
    finally { setSendingReminders(false) }
  }

  const pages = Math.max(1, Math.ceil(total/20))

  return (
    <div className="p-6">
      <PageHeader title="Fee Tracker" subtitle={`${total} fee records`}
        action={
          <div className="flex gap-2">
            <button onClick={sendReminders} disabled={sendingReminders}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition"
              style={{ background: '#D97706' }}>
              {sendingReminders ? <LoadingSpinner size={14} color="white" /> : <Bell size={14} />}
              Send Reminders
            </button>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: '#0B1D3A' }}>
              <Plus size={14} /> Add Record
            </button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label:'Total Expected', value:K(summary.total_due), color:'#0B1D3A' },
          { label:'Total Collected', value:K(summary.total_collected), color:'#059669' },
          { label:'Outstanding', value:K(summary.outstanding), color:'#DC2626' }
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold font-display mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search students..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400" />
          </div>
        </div>

        {loading ? <div className="flex items-center justify-center py-20"><LoadingSpinner size={32} /></div>
        : fees.length === 0 ? <EmptyState icon={Wallet} title="No fee records yet" description="Add fee records to track payments." actionLabel="Add Fee Record" onAction={openAdd} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Student','Grade','Term','Amount Due','Amount Paid','Balance','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fees.map((f, i) => (
                  <tr key={f.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i%2===0?'':'bg-gray-50/30'}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{f.student_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">Gr. {f.grade}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">T{f.term} {f.year}</td>
                    <td className="px-4 py-3 text-sm">{K(f.amount_due)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{K(f.amount_paid)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-500">{K(f.balance)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(f.status)}`}>{f.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Page {page} of {pages}</p>
                <div className="flex gap-1">
                  <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 rounded text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
                  <button disabled={page===pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1 rounded text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editFee ? 'Edit Fee Record' : 'Add Fee Record'} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Student <span className="text-red-400">*</span></label>
            {editFee ? (
              <input type="text" value={editFee.student_name} disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50" />
            ) : (
              <div className="relative">
                <input type="text" placeholder="Search student name..." value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); setForm(p=>({...p, student_id:''})) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400" />
                {studentSearch.length >= 1 && filteredStudents.length > 0 && !form.student_id && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20">
                    {filteredStudents.map(s => (
                      <button key={s.id} type="button"
                        onClick={() => { setForm(p=>({...p, student_id:s.id})); setStudentSearch(`${s.first_name} ${s.last_name}`) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                        {s.first_name} {s.last_name} — Grade {s.grade}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Term <span className="text-red-400">*</span></label>
              <select value={form.term} onChange={e => setForm(p=>({...p,term:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none">
                <option value="">Select</option>
                <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Year</label>
              <input type="number" value={form.year} onChange={e => setForm(p=>({...p,year:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Amount Due (K) <span className="text-red-400">*</span></label>
              <input type="number" step="0.01" value={form.amount_due} onChange={e => setForm(p=>({...p,amount_due:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Amount Paid (K)</label>
              <input type="number" step="0.01" value={form.amount_paid} onChange={e => setForm(p=>({...p,amount_paid:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm(p=>({...p,payment_method:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none">
                <option>Cash</option><option>MoMo</option><option>Bank</option><option>Bursary</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Payment Date</label>
              <input type="date" value={form.payment_date} onChange={e => setForm(p=>({...p,payment_date:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 disabled:opacity-60" style={{ background: '#0B1D3A' }}>
            {saving && <LoadingSpinner size={14} color="white" />}{saving ? 'Saving...' : editFee ? 'Save Changes' : 'Add Record'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
