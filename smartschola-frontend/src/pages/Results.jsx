import { useState, useEffect, useRef } from 'react'
import { Award, Search, Download } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import client from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

const getECZGrade = (s) => {
  if (s>=80)return 1;if(s>=70)return 2;if(s>=60)return 3;if(s>=50)return 4
  if(s>=40)return 5;if(s>=30)return 6;if(s>=20)return 7;if(s>=10)return 8;return 9
}
const getDivision = (agg) => {
  if(agg<=12)return{label:'Division I',color:'text-emerald-600'}
  if(agg<=19)return{label:'Division II',color:'text-blue-600'}
  if(agg<=25)return{label:'Division III',color:'text-amber-600'}
  if(agg<=32)return{label:'Division IV',color:'text-orange-600'}
  return{label:'Fail',color:'text-red-600'}
}
const gradeBadgeClass = (g) => {
  if(g<=2)return'bg-emerald-100 text-emerald-700'
  if(g<=4)return'bg-blue-100 text-blue-700'
  if(g<=6)return'bg-amber-100 text-amber-700'
  return'bg-red-100 text-red-700'
}

export default function Results() {
  const [query, setQuery] = useState('')
  const [allStudents, setAllStudents] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [marks, setMarks] = useState([])
  const [term, setTerm] = useState('1')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [loadingMarks, setLoadingMarks] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    client.get('/students', { params: { per_page: 200 } }).then(r => setAllStudents(r.data.students)).catch(()=>{})
  }, [])

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    const q = query.toLowerCase()
    setSuggestions(allStudents.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)).slice(0, 6))
  }, [query, allStudents])

  const selectStudent = async (student) => {
    setSelected(student)
    setQuery(`${student.first_name} ${student.last_name}`)
    setSuggestions([])
    await loadMarks(student.id)
  }

  const loadMarks = async (id) => {
    setLoadingMarks(true)
    try {
      const r = await client.get(`/marks/${id}`, { params: { term: parseInt(term), year: parseInt(year) } })
      setMarks(r.data)
    } catch { addToast('Failed to load marks', 'error') }
    finally { setLoadingMarks(false) }
  }

  const downloadPDF = async () => {
    if (!selected) return
    setDownloading(true)
    try {
      const r = await client.get(`/reports/student/${selected.id}/pdf`, {
        params: { term, year }, responseType: 'blob'
      })
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `report_${selected.first_name}_${selected.last_name}.pdf`; a.click()
      URL.revokeObjectURL(url)
      addToast('PDF downloaded', 'success')
    } catch { addToast('PDF generation failed', 'error') }
    finally { setDownloading(false) }
  }

  const totalScore = marks.reduce((s, m) => s + m.score, 0)
  const sortedByGrade = [...marks].sort((a, b) => a.ecz_grade - b.ecz_grade)
  const best5Agg = sortedByGrade.slice(0, 5).reduce((s, m) => s + m.ecz_grade, 0)
  const division = marks.length > 0 ? getDivision(best5Agg) : null

  return (
    <div className="p-6">
      <PageHeader title="Student Results" subtitle="Search a student to view their report" />

      {/* Search */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Type student name..."
              value={query} onChange={e => { setQuery(e.target.value); setSelected(null) }}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => selectStudent(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                    <span className="text-gray-400 ml-2 text-xs">Grade {s.grade} — {s.class_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select value={term} onChange={e => setTerm(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none">
            <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
          </select>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-24 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          {selected && (
            <button onClick={() => loadMarks(selected.id)} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ background: '#0B1D3A' }}>
              Reload
            </button>
          )}
        </div>
      </div>

      {/* Result Card */}
      {!selected ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <EmptyState icon={Award} title="Search for a student" description="Type a student's name above to view their academic results." />
        </div>
      ) : loadingMarks ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size={32} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between" style={{ background: '#0B1D3A', borderRadius: '1rem 1rem 0 0' }}>
            <div>
              <h2 className="font-display font-bold text-xl text-white">{selected.first_name} {selected.last_name}</h2>
              <p className="text-white/60 text-sm mt-0.5">Grade {selected.grade} · Class {selected.class_name} · Term {term} · {year}</p>
            </div>
            <div className="flex items-center gap-3">
              {division && <span className={`px-3 py-1 rounded-full text-sm font-bold bg-white/10 ${division.color.replace('text-','text-')}`} style={{ color: '#F5A623' }}>{division.label}</span>}
              <button onClick={downloadPDF} disabled={downloading || marks.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-40">
                {downloading ? <LoadingSpinner size={14} color="white" /> : <Download size={14} />}
                {downloading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>

          {marks.length === 0 ? (
            <EmptyState icon={Award} title="No marks found" description={`No marks recorded for Term ${term}, ${year}.`} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Subject','Score','ECZ Grade','Remark'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m, i) => (
                      <tr key={m.id} className={`border-b border-gray-50 ${i%2===0?'':'bg-gray-50/30'}`}>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{m.subject_name}</td>
                        <td className="px-5 py-3 text-sm font-bold" style={{ color: '#0B1D3A' }}>{m.score}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeBadgeClass(m.ecz_grade)}`}>Grade {m.ecz_grade}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{m.ai_remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-6 bg-gray-50/50" style={{ borderRadius: '0 0 1rem 1rem' }}>
                <div><span className="text-xs text-gray-400 uppercase tracking-wide">Total Score</span><p className="font-bold text-lg" style={{ color: '#0B1D3A' }}>{totalScore}</p></div>
                <div><span className="text-xs text-gray-400 uppercase tracking-wide">Best 5 Aggregate</span><p className="font-bold text-lg" style={{ color: '#0B1D3A' }}>{best5Agg}</p></div>
                {division && <div><span className="text-xs text-gray-400 uppercase tracking-wide">Division</span><p className={`font-bold text-lg ${division.color}`}>{division.label}</p></div>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
