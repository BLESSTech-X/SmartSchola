import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, Bell, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal, EmptyState, LoadingSpinner, StatCard } from '../components/index'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

const statusColors = { Paid: 'bg-green-100 text-green-700', Partial: 'bg-yellow-100 text-yellow-700', Unpaid: 'bg-red-100 text-red-700' }

export default function FeeTracker() {
  const [fees, setFees] = useState([])
  const [summary, setSummary] = useState({ total_due: 0, total_collected: 0, outstanding: 0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ student_id: '', term: '1', year: new Date().getFullYear(), amount_due: '', amount_paid: '0', payment_method: 'Cash', payment_date: '', notes: '' })
  const [studentSearch, setStudentSearch] = useState('')
  const [studentOptions, setStudentOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const { addToast } = useToast()

  const fetchFees = useCallback(async () => {
    setLoading(true)
    try {
      const [feesRes, summaryRes] = await Promise.all([
        client.get('/fees', { params: { search, page, per_page: 20 } }),
        client.get('/fees/summary')
      ])
      setFees(feesRes.data.fees || [])
      setTotal(feesRes.data.total || 0)
      setSummary(summaryRes.data)
    } catch { addToast('Failed to load fees', 'error') }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { fetchFees() }, [fetchFees])
  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    if (studentSearch.length < 2) { setStudentOptions([]); return }
    const t = setTimeout(async () => {
      const { data } = await client.get('/students', { params: { search: studentSearch, per_page: 5 } })
      setStudentOptions(data.students || [])
    }, 300)
    return () => clearTimeout(t)
  }, [studentSearch])

  const openAdd = () => { setForm({ student_id: '', term: '1', year: new Date().getFullYear(), amount_due: '', amount_paid: '0', payment_method: 'Cash', payment_date: '', notes: '' }); setSelected(null); setModal('add') }
  const openEdit = (f) => { setSelected(f); setForm({ student_id: f.student_id, term: f.term, year: f.year, amount_due: f.amount_due, amount_paid: f.amount_paid, payment_method: f.payment_method || 'Cash', payment_date: f.payment_date || '', notes: f.notes || '' }); setModal('edit') }
  const openDelete = (f) => { setSelected(f); setModal('delete') }

  const handleSave = async () => {
    if (!form.student_id || !form.amount_due) { addToast('Student and amount due are required', 'warning'); return }
    setSaving(true)
    try {
      const payload = { ...form, term: parseInt(form.term), year: parseInt(form.year), amount_due: parseFloat(form.amount_due), amount_paid: parseFloat(form.amount_paid) }
      if (modal === 'add') await client.post('/fees', payload)
      else await client.put(`/fees/${selected.id}`, payload)
      addToast(modal === 'add' ? 'Fee record added' : 'Fee record updated', 'success')
      setModal(null); fetchFees()
    } catch (err) { addToast(err.response?.data?.detail || 'Failed to save', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try { await client.delete(`/fees/${selected.id}`); addToast('Fee record deleted', 'success'); setModal(null); fetchFees() }
    catch { addToast('Failed to delete', 'error') } finally { setSaving(false) }
  }

  const sendReminders = async () => {
    setSendingReminders(true)
    try {
      const { data } = await client.post('/fees/send-reminders')
      addToast(`Sent ${data.sent} reminders${data.failed > 0 ? ` (${data.failed} failed)` : ''}`, 'success')
    } catch { addToast('Failed to send reminders', 'error') } finally { setSendingReminders(false) }
  }

  const balance = parseFloat(form.amount_due || 0) - parseFloat(form.amount_paid || 0)
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-navy text-2xl lg:text-3xl font-bold">Fee Tracker</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track school fees in Zambian Kwacha</p>
        </div>
        <div className="flex gap-2">
          <button onClick={sendReminders} disabled={sendingReminders} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-60">
            {sendingReminders ? <div className="w-4 h-4 border border-gray-400 border-t-gray-700 rounded-full animate-spin" /> : <Bell size={15} />}
            Send Reminders
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all">
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border-l-4 border-navy shadow-sm"><p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Expected</p><p className="font-display text-navy text-xl font-bold">K {summary.total_due.toFixed(2)}</p></div>
        <div className="bg-white rounded-2xl p-4 border-l-4 border-green-500 shadow-sm"><p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Collected</p><p className="font-display text-green-700 text-xl font-bold">K {summary.total_collected.toFixed(2)}</p></div>
        <div className="bg-white rounded-2xl p-4 border-l-4 border-red-500 shadow-sm"><p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Outstanding</p><p className="font-display text-red-600 text-xl font-bold">K {summary.outstanding.toFixed(2)}</p></div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name..." className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner className="py-16" /> : fees.length === 0 ? (
          <EmptyState icon={<CreditCard size={32} />} title="No fee records" description='Click "Add Record" to start tracking fees' />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-navy text-white">
                  {['Student','Term/Year','Amount Due','Paid','Balance','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {fees.map((f, i) => (
                    <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${i%2===0?'':'bg-gray-50/50'}`}>
                      <td className="px-4 py-3.5 font-medium text-navy">{f.student?.first_name} {f.student?.last_name}<br/><span className="text-xs text-gray-400">Gr.{f.student?.grade} · {f.student?.class_name}</span></td>
                      <td className="px-4 py-3.5 text-gray-600">T{f.term} / {f.year}</td>
                      <td className="px-4 py-3.5 text-gray-700">K {f.amount_due.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-green-700 font-medium">K {f.amount_paid.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-red-600 font-medium">K {f.balance.toFixed(2)}</td>
                      <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[f.status]}`}>{f.status}</span></td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-navy hover:bg-navy/10 rounded-lg mr-1 transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => openDelete(f)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
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
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={16} /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal==='add'||modal==='edit'} onClose={() => setModal(null)} title={modal==='add'?'Add Fee Record':'Edit Fee Record'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modal === 'add' && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Student *</label>
              <div className="relative">
                <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search student..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                {studentOptions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-10">
                    {studentOptions.map(s => (
                      <button key={s.id} onClick={() => { setForm(f => ({...f, student_id: s.id})); setStudentSearch(`${s.first_name} ${s.last_name}`); setStudentOptions([]) }} className="w-full text-left px-4 py-2.5 hover:bg-gold/5 text-sm border-b border-gray-50 last:border-0">
                        {s.first_name} {s.last_name} <span className="text-gray-400">· Gr.{s.grade}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {[['term','Term','1',['1','2','3']],['year','Year',null,null],['amount_due','Amount Due (K) *',null,null],['amount_paid','Amount Paid (K)',null,null]].map(([key, label, def, opts]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
              {opts ? (
                <select value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold">
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type="number" value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
              )}
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Payment Method</label>
            <select value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold">
              {['Cash','MoMo','Bank','Bursary'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Payment Date</label>
            <input type="date" value={form.payment_date} onChange={e => setForm(f => ({...f, payment_date: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none" />
          </div>
          {form.amount_due && (
            <div className="sm:col-span-2 bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-blue-700 font-medium">Calculated Balance:</span>
              <span className={`font-bold text-lg ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>K {Math.max(0, balance).toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-medium hover:bg-navy-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Record'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal==='delete'} onClose={() => setModal(null)} title="Delete Fee Record" size="sm">
        <p className="text-gray-600 text-sm mb-5">Delete the fee record for <strong>{selected?.student?.first_name} {selected?.student?.last_name}</strong> (Term {selected?.term}, {selected?.year})?</p>
        <div className="flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-60">{saving ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  )
}
