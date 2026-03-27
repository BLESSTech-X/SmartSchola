import React, { useState, useEffect } from 'react'
import { Search, Download, BarChart3 } from 'lucide-react'
import { LoadingSpinner } from '../components/index'
import { useToast } from '../context/ToastContext'
import client, { API_URL } from '../api/client'

function eczGrade(score) {
  if (score >= 80) return 1; if (score >= 70) return 2; if (score >= 60) return 3
  if (score >= 50) return 4; if (score >= 40) return 5; if (score >= 30) return 6
  if (score >= 20) return 7; if (score >= 10) return 8; return 9
}

function division(grades) {
  if (!grades.length) return 'N/A'
  const best5 = [...grades].sort((a,b) => a-b).slice(0,5)
  const agg = best5.reduce((s,g) => s+g, 0)
  if (agg <= 12) return 'Division I'; if (agg <= 19) return 'Division II'
  if (agg <= 25) return 'Division III'; if (agg <= 32) return 'Division IV'
  return 'Fail'
}

function gradeBadge(grade) {
  const cfg = [[1,'bg-green-500 text-white'],[2,'bg-green-400 text-white'],[3,'bg-blue-500 text-white'],[4,'bg-blue-400 text-white'],[5,'bg-yellow-500 text-white'],[6,'bg-yellow-400 text-white'],[7,'bg-red-500 text-white'],[8,'bg-red-400 text-white'],[9,'bg-red-600 text-white']]
  const color = cfg.find(c => c[0] === grade)?.[1] || 'bg-gray-200 text-gray-700'
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${color}`}>G{grade}</span>
}

export default function Results() {
  const [search, setSearch] = useState('')
  const [matches, setMatches] = useState([])
  const [selected, setSelected] = useState(null)
  const [term, setTerm] = useState('1')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [marks, setMarks] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingMarks, setLoadingMarks] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (search.length < 2) { setMatches([]); return }
    const t = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const { data } = await client.get('/students', { params: { search, per_page: 8 } })
        setMatches(data.students || [])
      } catch {} finally { setLoadingSearch(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!selected) return
    const fetch = async () => {
      setLoadingMarks(true)
      try {
        const { data } = await client.get(`/marks/${selected.id}`, { params: { term, year } })
        setMarks(data || [])
      } catch { addToast('Failed to load marks', 'error') }
      finally { setLoadingMarks(false) }
    }
    fetch()
  }, [selected, term, year])

  const selectStudent = (s) => { setSelected(s); setSearch(''); setMatches([]) }

  const downloadPDF = async () => {
    if (!selected) return
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const url = `${API_URL}/reports/student/${selected.id}/pdf?term=${term}&year=${year}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `report_${selected.first_name}_${selected.last_name}_T${term}_${year}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      addToast('PDF downloaded!', 'success')
    } catch { addToast('Failed to generate PDF', 'error') }
    finally { setDownloading(false) }
  }

  const totalScore = marks.reduce((s, m) => s + m.score, 0)
  const div = division(marks.map(m => m.ecz_grade).filter(Boolean))

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl lg:text-3xl font-bold">Results</h1>
        <p className="text-gray-500 text-sm mt-0.5">Search for a student to view and download their results</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-lg">
        <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student name..." className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white" />
        {loadingSearch && <div className="absolute right-4 top-3.5"><LoadingSpinner size="sm" /></div>}
        {matches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
            {matches.map(s => (
              <button key={s.id} onClick={() => selectStudent(s)} className="w-full text-left px-4 py-3 hover:bg-gold/5 transition-colors border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-navy">{s.first_name} {s.last_name}</p>
                <p className="text-xs text-gray-400">Grade {s.grade} · {s.class_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fade-in">
          {/* Term/Year selector */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <select value={term} onChange={e => setTerm(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40">
              <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
            </select>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} min="2020" max="2035" className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <button onClick={downloadPDF} disabled={downloading || marks.length === 0} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-400 transition-all disabled:opacity-50">
              {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Download size={14} /> Download PDF</>}
            </button>
          </div>

          {/* Result card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-navy px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">{selected.first_name} {selected.last_name}</h2>
                  <p className="text-white/60 text-sm mt-0.5">Grade {selected.grade} · Class {selected.class_name} · Term {term}, {year}</p>
                </div>
                <BarChart3 size={28} className="text-gold" />
              </div>
              {marks.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                  <div className="text-center"><p className="text-2xl font-bold text-gold">{totalScore}</p><p className="text-xs text-white/50 mt-0.5">Total Score</p></div>
                  <div className="text-center"><p className="text-lg font-bold">{div}</p><p className="text-xs text-white/50 mt-0.5">Division</p></div>
                  <div className="text-center"><p className="text-2xl font-bold">{marks.length}</p><p className="text-xs text-white/50 mt-0.5">Subjects</p></div>
                </div>
              )}
            </div>

            {/* Marks table */}
            {loadingMarks ? <LoadingSpinner className="py-12" /> : marks.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No marks recorded for Term {term}, {year}</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Remark</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {marks.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-navy">{m.subject?.name || 'Unknown'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-bold text-navy">{m.score}</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gold rounded-full" style={{width: `${m.score}%`}} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">{gradeBadge(m.ecz_grade)}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs hidden md:table-cell">{m.ai_remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
