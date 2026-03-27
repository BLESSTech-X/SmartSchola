import React, { useState, useEffect } from 'react'
import { BookOpen, RefreshCw, Save, AlertTriangle } from 'lucide-react'
import { LoadingSpinner } from '../components/index'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

function eczGrade(score) {
  const s = parseInt(score)
  if (isNaN(s)) return null
  if (s >= 80) return 1; if (s >= 70) return 2; if (s >= 60) return 3
  if (s >= 50) return 4; if (s >= 40) return 5; if (s >= 30) return 6
  if (s >= 20) return 7; if (s >= 10) return 8; return 9
}

function gradeBadge(grade) {
  if (!grade) return null
  const colors = { 1: 'bg-green-100 text-green-800', 2: 'bg-green-50 text-green-700', 3: 'bg-blue-100 text-blue-700', 4: 'bg-blue-50 text-blue-600', 5: 'bg-yellow-100 text-yellow-700', 6: 'bg-yellow-50 text-yellow-600', 7: 'bg-red-100 text-red-700', 8: 'bg-red-50 text-red-600', 9: 'bg-red-200 text-red-800' }
  return <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${colors[grade]}`}>G{grade}</span>
}

export default function MarkEntry() {
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({ class_name: '', subject_id: '', term: '1', year: new Date().getFullYear().toString() })
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  useEffect(() => { client.get('/subjects').then(r => setSubjects(r.data)).catch(() => {}) }, [])

  const loadStudents = async () => {
    if (!filters.class_name || !filters.subject_id) { addToast('Select a class and subject first', 'warning'); return }
    setLoadingStudents(true)
    try {
      const { data } = await client.get('/students', { params: { class_name: filters.class_name, per_page: 100 } })
      setStudents(data.students || [])
      // Pre-fill existing marks
      if (data.students?.length > 0) {
        const marksRes = await client.get(`/marks/${data.students[0].id}`, { params: { term: filters.term, year: filters.year } }).catch(() => ({ data: [] }))
        const existing = {}
        for (const s of data.students) {
          try {
            const mr = await client.get(`/marks/${s.id}`, { params: { term: filters.term, year: filters.year, subject_id: filters.subject_id } })
            const match = mr.data.find(m => m.subject_id === parseInt(filters.subject_id))
            if (match) existing[s.id] = match.score.toString()
          } catch {}
        }
        setScores(existing)
      }
      setLoaded(true)
    } catch { addToast('Failed to load students', 'error') }
    finally { setLoadingStudents(false) }
  }

  const handleSave = async () => {
    const marks = students.filter(s => scores[s.id] !== undefined && scores[s.id] !== '').map(s => ({
      student_id: s.id,
      subject_id: parseInt(filters.subject_id),
      term: parseInt(filters.term),
      year: parseInt(filters.year),
      score: parseInt(scores[s.id]),
    })).filter(m => m.score >= 0 && m.score <= 100)

    if (marks.length === 0) { addToast('No valid marks to save', 'warning'); return }
    setSaving(true)
    try {
      const { data } = await client.post('/marks/bulk', { marks })
      let msg = `Saved ${data.saved} new, updated ${data.updated} marks`
      if (data.flagged?.length > 0) msg += `. ⚠ Verify: ${data.flagged.join(', ')}`
      addToast(msg, data.flagged?.length > 0 ? 'warning' : 'success')
    } catch (err) { addToast(err.response?.data?.detail || 'Failed to save marks', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl lg:text-3xl font-bold">Mark Entry</h1>
        <p className="text-gray-500 text-sm mt-0.5">Enter examination scores for your class</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Class</label>
            <input value={filters.class_name} onChange={e => { setFilters(f => ({...f, class_name: e.target.value})); setLoaded(false) }} placeholder="e.g. 7A" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Subject</label>
            <select value={filters.subject_id} onChange={e => { setFilters(f => ({...f, subject_id: e.target.value})); setLoaded(false) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold">
              <option value="">Select...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Term</label>
            <select value={filters.term} onChange={e => { setFilters(f => ({...f, term: e.target.value})); setLoaded(false) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold">
              <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Year</label>
            <input type="number" value={filters.year} onChange={e => { setFilters(f => ({...f, year: e.target.value})); setLoaded(false) }} min="2020" max="2035" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
          </div>
          <div className="flex items-end">
            <button onClick={loadStudents} disabled={loadingStudents} className="w-full flex items-center justify-center gap-2 bg-navy text-white py-2 rounded-lg text-sm font-medium hover:bg-navy-400 transition-all disabled:opacity-60">
              {loadingStudents ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RefreshCw size={14} /> Load Students</>}
            </button>
          </div>
        </div>
      </div>

      {/* Mark table */}
      {loaded && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-navy text-sm">{filters.class_name} · {subjects.find(s => s.id === parseInt(filters.subject_id))?.name} · Term {filters.term}, {filters.year}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{students.length} students loaded</p>
            </div>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gold text-navy px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gold-600 transition-all disabled:opacity-60">
              {saving ? <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> : <><Save size={14} /> Save All Marks</>}
            </button>
          </div>
          {students.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No students in class <strong>{filters.class_name}</strong></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score (0–100)</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ECZ Grade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Remark</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s, i) => {
                    const score = scores[s.id] ?? ''
                    const grade = score !== '' ? eczGrade(score) : null
                    const invalid = score !== '' && (parseInt(score) < 0 || parseInt(score) > 100 || isNaN(parseInt(score)))
                    const remarks = ['','Excellent performance. Keep it up!','Very good performance. Commendable effort.','Good performance. Work harder for distinction.','Satisfactory. More effort needed.','Average. Focus on weak areas.','Below average. Seek teacher guidance.','Poor. Consistent study strongly advised.','Very poor. Urgent attention needed.','Extremely poor. Immediate intervention required.']
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-400 text-xs">{i+1}</td>
                        <td className="px-4 py-3 font-medium text-navy">{s.first_name} {s.last_name}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number" min="0" max="100"
                            value={score}
                            onChange={e => setScores(prev => ({...prev, [s.id]: e.target.value}))}
                            placeholder="—"
                            className={`w-20 px-2.5 py-1.5 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all ${invalid ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                          />
                        </td>
                        <td className="px-4 py-3">{grade ? gradeBadge(grade) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{grade ? remarks[grade] : ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
