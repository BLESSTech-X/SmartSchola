import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Plus, Pencil, Trash2, CheckCircle2, Star } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { listAcademicYears, saveAcademicYear, setCurrentAcademicYear, removeAcademicYear } from '../lib/academicYearRecords.js'

const emptyForm = { name: '', startsOn: '', endsOn: '', isCurrent: false }
const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100'

function dateLabel(value) {
  if (!value) return 'Not set'
  return new Date(value + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AcademicYears() {
  const { currentUser } = useAuth()
  const { addToast } = useToast()
  const schoolId = currentUser?.school_id
  const [years, setYears] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const refresh = useCallback(async () => {
    const rows = await listAcademicYears(schoolId)
    setYears(rows)
  }, [schoolId])

  useEffect(() => {
    let alive = true
    listAcademicYears(schoolId)
      .then(rows => { if (alive) setYears(rows) })
      .catch(error => { if (alive) addToast(error.message || 'Could not load academic years.', 'error') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [schoolId, addToast])

  const startEdit = year => {
    setEditingId(year.id)
    setForm({ name: year.name, startsOn: year.starts_on || '', endsOn: year.ends_on || '', isCurrent: year.is_current })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => { setEditingId(null); setForm(emptyForm) }

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    try {
      await saveAcademicYear({ schoolId, yearId: editingId, ...form })
      await refresh()
      addToast(editingId ? 'Academic year updated.' : 'Academic year created.', 'success')
      resetForm()
    } catch (error) {
      addToast(error.message || 'Could not save academic year.', 'error')
    } finally { setSaving(false) }
  }

  const makeCurrent = async year => {
    try {
      await setCurrentAcademicYear({ schoolId, yearId: year.id })
      await refresh()
      addToast(year.name + ' is now the current academic year.', 'success')
    } catch (error) { addToast(error.message || 'Could not change the current year.', 'error') }
  }

  const remove = async year => {
    if (!window.confirm('Delete academic year "' + year.name + '"?')) return
    setDeletingId(year.id)
    try {
      await removeAcademicYear({ schoolId, yearId: year.id })
      await refresh()
      addToast('Academic year deleted.', 'success')
      if (editingId === year.id) resetForm()
    } catch (error) { addToast(error.message || 'Could not delete academic year.', 'error') }
    finally { setDeletingId(null) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size={32} /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Academic Years" subtitle="Set your school's academic calendar and current year." />
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><CalendarDays size={21}/></span>
          <div><h2 className="font-semibold text-gray-900">{editingId ? 'Edit academic year' : 'Add academic year'}</h2><p className="text-sm text-gray-500">Example: 2026 or 2026 Academic Year</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Year name
              <input className={inputClass + ' mt-1.5'} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 2026" maxLength={60} required/>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Start date
              <input className={inputClass + ' mt-1.5'} type="date" value={form.startsOn} onChange={e => setForm(p => ({ ...p, startsOn: e.target.value }))}/>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">End date
              <input className={inputClass + ' mt-1.5'} type="date" min={form.startsOn || undefined} value={form.endsOn} onChange={e => setForm(p => ({ ...p, endsOn: e.target.value }))}/>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="h-4 w-4 accent-amber-500" checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))}/> Set as the current academic year</label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#0B1D3A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#142c50] disabled:opacity-60">{saving ? <LoadingSpinner size={15} color="white"/> : <Plus size={16}/>} {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add academic year'}</button>
            {editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><h2 className="font-semibold text-gray-900">Your academic years</h2><p className="mt-0.5 text-xs text-gray-500">{years.length} year{years.length === 1 ? '' : 's'} recorded for this school</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{years.length} total</span></div>
        {years.length === 0 ? <div className="px-6 py-12 text-center"><CalendarDays size={30} className="mx-auto mb-3 text-gray-300"/><h3 className="font-semibold text-gray-800">No academic years yet</h3><p className="mt-1 text-sm text-gray-500">Add your school's first academic year above. You can then assign classes to it.</p></div> :
          <div className="divide-y divide-gray-100">{years.map(year => <article key={year.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900">{year.name}</h3>{year.is_current && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13}/> Current year</span>}</div><p className="mt-1 text-sm text-gray-500">{dateLabel(year.starts_on)} <span className="px-1 text-gray-300">→</span> {dateLabel(year.ends_on)}</p></div>
            <div className="flex flex-wrap items-center gap-2">{!year.is_current && <button type="button" onClick={() => makeCurrent(year)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"><Star size={14}/> Make current</button>}<button type="button" onClick={() => startEdit(year)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"><Pencil size={14}/> Edit</button><button type="button" onClick={() => remove(year)} disabled={deletingId === year.id} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">{deletingId === year.id ? <LoadingSpinner size={13}/> : <Trash2 size={14}/>} Delete</button></div>
          </article>)}</div>}
      </section>
      <p className="text-xs leading-5 text-gray-400">Academic years are private to this school. A year already used by a class cannot be deleted until those classes are reassigned.</p>
    </div>
  )
}
