import { useState, useEffect } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import client from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

const getECZGrade = (score) => {
  if (score >= 80) return 1; if (score >= 70) return 2; if (score >= 60) return 3
  if (score >= 50) return 4; if (score >= 40) return 5; if (score >= 30) return 6
  if (score >= 20) return 7; if (score >= 10) return 8; return 9
}
const gradeBadge = (g) => {
  if (g <= 2) return 'bg-emerald-100 text-emerald-700'
  if (g <= 4) return 'bg-blue-100 text-blue-700'
  if (g <= 6) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function MarkEntry() {
  const [subjects, setSubjects] = useState([])
  const [filter, setFilter] = useState({ class_name: '', subject_id: '', term: '', year: new Date().getFullYear() })
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    client.get('/subjects').then(r => setSubjects(r.data)).catch(() => {})
  }, [])

  const loadStudents = async () => {
    if (!filter.class_name || !filter.subject_id || !filter.term) {
      addToast('Please select class, subject, and term', 'warning'); return
    }
    setLoadingStudents(true)
    try {
      const r = await client.get('/students', { params: { class_name: filter.class_name, per_page: 100 } })
      setStudents(r.data.students)
      const initialMarks = {}
      r.data.students.forEach(s => { initialMarks[s.id] = '' })
      setMarks(initialMarks)
      setLoaded(true)
      if (r.data.students.length === 0) addToast('No students found in this class', 'info')
    } catch { addToast('Failed to load students', 'error') }
    finally { setLoadingStudents(false) }
  }

  const handleMarkChange = (studentId, value) => {
    const num = value === '' ? '' : Math.min(100, Math.max(0, parseInt(value) || 0))
    setMarks(p => ({ ...p, [studentId]: num }))
  }

  const handleSave = async () => {
    const payload = students
      .filter(s => marks[s.id] !== '' && marks[s.id] !== undefined)
      .map(s => ({ student_id: s.id, subject_id: parseInt(filter.subject_id), term: parseInt(filter.term), year: parseInt(filter.year), score: parseInt(marks[s.id]) }))

    if (payload.length === 0) { addToast('No marks to save', 'warning'); return }
    setSaving(true)
    try {
      const r = await client.post('/marks/bulk', { marks: payload })
      addToast(`Saved ${r.data.saved} marks, updated ${r.data.updated}. ${r.data.flagged.length > 0 ? `⚠ Verify: ${r.data.flagged.join(', ')}` : ''}`, r.data.flagged.length > 0 ? 'warning' : 'success')
    } catch (err) { addToast(err.response?.data?.detail || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleClear = () => {
    const empty = {}
    students.forEach(s => { empty[s.id] = '' })
    setMarks(empty)
  }

  return (
    <div className="p-6">
      <PageHeader title="Mark Entry" subtitle="Enter student marks by class and subject" />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 1 — Select Class & Subject</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Class (e.g. 7A)"
            value={filter.class_name}
            onChange={e => setFilter(p => ({ ...p, class_name: e.target.value }))}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"
          />
          <select value={filter.subject_id} onChange={e => setFilter(p => ({ ...p, subject_id: e.target.value }))}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400">
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filter.term} onChange={e => setFilter(p => ({ ...p, term: e.target.value }))}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none">
            <option value="">Select Term</option>
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
          <input type="number" placeholder="Year" value={filter.year} onChange={e => setFilter(p => ({ ...p, year: e.target.value }))}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          <button onClick={loadStudents} disabled={loadingStudents}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
            style={{ background: '#0B1D3A' }}>
            {loadingStudents ? <LoadingSpinner size={14} color="white" /> : <RefreshCw size={14} />}
            {loadingStudents ? 'Loading...' : 'Load Students'}
          </button>
        </div>
      </div>

      {/* Mark Table */}
      {!loaded ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <EmptyState icon={ClipboardList} title="No students loaded" description="Select a class, subject, and term above, then click Load Students." />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <EmptyState icon={ClipboardList} title="No students in this class" description="Add students to this class first." />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step 2 — Enter Marks</p>
            <div className="flex gap-2">
              <button onClick={handleClear} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50">Clear All</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 hover:opacity-90 disabled:opacity-60" style={{ background: '#059669' }}>
                {saving && <LoadingSpinner size={12} color="white" />}{saving ? 'Saving...' : 'Save All Marks'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['#','Student Name','Mark (0–100)','ECZ Grade','Remark'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const score = parseInt(marks[s.id])
                  const grade = !isNaN(score) ? getECZGrade(score) : null
                  const invalid = marks[s.id] !== '' && (score < 0 || score > 100)
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs text-gray-400">{i+1}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min="0" max="100"
                          value={marks[s.id] ?? ''}
                          onChange={e => handleMarkChange(s.id, e.target.value)}
                          placeholder="—"
                          className={`w-20 px-3 py-1.5 rounded-lg border text-sm text-center focus:outline-none ${invalid ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-yellow-400'}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {grade !== null ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeBadge(grade)}`}>Grade {grade}</span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">
                        {grade !== null ? (
                          grade <= 2 ? 'Excellent performance' :
                          grade <= 4 ? 'Good — keep it up' :
                          grade <= 6 ? 'Needs more effort' : 'Urgent intervention needed'
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
