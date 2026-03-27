import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, User, BarChart2, CreditCard, FileText, Download, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '../components/index'
import { useAuth } from '../context/AuthContext'
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
  if (agg <= 25) return 'Division III'; if (agg <= 32) return 'Division IV'; return 'Fail'
}
function gradeColor(g) {
  if (g <= 2) return 'bg-green-500 text-white'
  if (g <= 4) return 'bg-blue-500 text-white'
  if (g <= 6) return 'bg-yellow-500 text-white'
  return 'bg-red-500 text-white'
}

export default function ParentPortal() {
  const [tab, setTab] = useState('child')
  const [data, setData] = useState(null)
  const [marks, setMarks] = useState([])
  const [fees, setFees] = useState([])
  const [availTerms, setAvailTerms] = useState([])
  const [term, setTerm] = useState('1')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)
  const [loadingMarks, setLoadingMarks] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { currentUser, logout } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      client.get('/parent/my-child'),
      client.get('/parent/fees'),
      client.get('/parent/available-terms')
    ]).then(([d, f, t]) => {
      setData(d.data)
      setFees(f.data || [])
      setAvailTerms(t.data || [])
      setMarks(d.data.marks || [])
      if (d.data.latest_term) setTerm(d.data.latest_term.toString())
      if (d.data.latest_year) setYear(d.data.latest_year.toString())
    }).catch(() => addToast('Failed to load data', 'error')).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data || tab !== 'results') return
    setLoadingMarks(true)
    client.get('/parent/marks', { params: { term, year } }).then(r => setMarks(r.data || [])).catch(() => {}).finally(() => setLoadingMarks(false))
  }, [term, year, tab])

  const handleLogout = () => { logout(); navigate('/parent-login') }

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const url = `${API_URL}/parent/report/pdf?term=${term}&year=${year}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('No report found')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = blobUrl
      a.download = `report_T${term}_${year}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      addToast('Report downloaded!', 'success')
    } catch (err) { addToast(err.message || 'Failed to download report', 'error') }
    finally { setDownloading(false) }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>

  const student = data?.student
  const feeSummary = data?.fee_summary || { total_due: 0, total_paid: 0, outstanding: 0 }
  const totalScore = marks.reduce((s, m) => s + m.score, 0)
  const div = division(marks.map(m => m.ecz_grade || eczGrade(m.score)).filter(Boolean))
  const paidFees = fees.filter(f => f.status === 'Paid').length
  const unpaidFees = fees.filter(f => f.status !== 'Paid').length

  const tabs = [
    { key: 'child', label: 'My Child', icon: <User size={16} /> },
    { key: 'results', label: 'Results', icon: <BarChart2 size={16} /> },
    { key: 'fees', label: 'Fees', icon: <CreditCard size={16} /> },
    { key: 'report', label: 'Report', icon: <FileText size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center"><GraduationCap size={18} className="text-navy" /></div>
          <div>
            <p className="font-display font-bold text-sm leading-tight">{data?.school_name || 'Smart Schola'}</p>
            <p className="text-white/50 text-xs">{currentUser?.full_name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-all"><LogOut size={16} /></button>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-4 sticky top-[60px] z-10">
        <div className="flex gap-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${tab===t.key?'border-gold text-navy':'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* My Child Tab */}
        {tab === 'child' && student && (
          <div className="space-y-4 fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="font-display text-gold text-2xl font-bold">{student.first_name[0]}{student.last_name[0]}</span>
              </div>
              <h2 className="font-display text-navy text-xl font-bold">{student.first_name} {student.last_name}</h2>
              <p className="text-gray-500 text-sm mt-1">Grade {student.grade} · Class {student.class_name}</p>
              {student.gender && <p className="text-gray-400 text-xs mt-0.5">{student.gender}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center shadow-sm">
                <p className="font-display text-navy text-2xl font-bold">{data?.marks_count || 0}</p>
                <p className="text-gray-400 text-xs mt-1">Subjects</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center shadow-sm">
                <p className="font-display text-red-600 text-xl font-bold">K{feeSummary.outstanding.toFixed(0)}</p>
                <p className="text-gray-400 text-xs mt-1">Outstanding</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center shadow-sm">
                <p className="font-display text-navy text-xl font-bold">T{data?.latest_term}</p>
                <p className="text-gray-400 text-xs mt-1">Latest Term</p>
              </div>
            </div>

            {data?.marks?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-navy text-sm mb-3">Latest Results Preview</h3>
                <div className="space-y-2">
                  {data.marks.slice(0, 4).map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 flex-1 truncate">{m.subject}</span>
                      <span className="font-bold text-navy text-sm">{m.score}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${gradeColor(m.ecz_grade || eczGrade(m.score))}`}>G{m.ecz_grade || eczGrade(m.score)}</span>
                    </div>
                  ))}
                  {data.marks.length > 4 && <p className="text-xs text-gray-400 mt-2">+{data.marks.length - 4} more subjects</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {tab === 'results' && (
          <div className="fade-in">
            <div className="flex gap-2 mb-4">
              <select value={term} onChange={e => setTerm(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white">
                <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
              </select>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white" />
            </div>

            {loadingMarks ? <LoadingSpinner className="py-12" /> : marks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No marks for Term {term}, {year}</div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-navy text-white rounded-2xl p-4 text-center"><p className="font-display text-2xl font-bold text-gold">{totalScore}</p><p className="text-xs text-white/60 mt-1">Total Score</p></div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm"><p className="font-display text-navy text-lg font-bold">{div}</p><p className="text-xs text-gray-400 mt-1">Division</p></div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm"><p className="font-display text-navy text-2xl font-bold">{marks.length}</p><p className="text-xs text-gray-400 mt-1">Subjects</p></div>
                </div>
                <div className="space-y-3">
                  {marks.map((m, i) => {
                    const g = m.ecz_grade || eczGrade(m.score)
                    return (
                      <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-navy text-sm">{m.subject}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${gradeColor(g)}`}>G{g}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full transition-all" style={{width: `${m.score}%`}} /></div>
                          <span className="font-bold text-navy text-sm w-8 text-right">{m.score}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{m.remark}</p>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Fees Tab */}
        {tab === 'fees' && (
          <div className="fade-in space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center"><p className="font-display text-navy text-lg font-bold">K{feeSummary.total_due.toFixed(0)}</p><p className="text-xs text-gray-400 mt-1">Total Due</p></div>
              <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm text-center"><p className="font-display text-green-700 text-lg font-bold">K{feeSummary.total_paid.toFixed(0)}</p><p className="text-xs text-gray-400 mt-1">Paid</p></div>
              <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-sm text-center"><p className="font-display text-red-600 text-lg font-bold">K{feeSummary.outstanding.toFixed(0)}</p><p className="text-xs text-gray-400 mt-1">Balance</p></div>
            </div>

            {feeSummary.outstanding > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 text-sm">You have an outstanding balance of <strong>K{feeSummary.outstanding.toFixed(2)}</strong>. Please visit the school to settle this balance.</p>
              </div>
            )}

            <div className="space-y-2">
              {fees.map(f => (
                <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-navy text-sm">Term {f.term}, {f.year}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.status==='Paid'?'bg-green-100 text-green-700':f.status==='Partial'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{f.status}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Due: K{f.amount_due.toFixed(2)}</span>
                    <span>Paid: K{f.amount_paid.toFixed(2)}</span>
                    <span className="font-medium text-red-600">Balance: K{f.balance.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {fees.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No fee records found</p>}
            </div>
          </div>
        )}

        {/* Report Tab */}
        {tab === 'report' && (
          <div className="fade-in space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText size={28} className="text-navy" /></div>
              <h3 className="font-display text-navy text-lg font-semibold mb-2">Download Report Slip</h3>
              <p className="text-gray-400 text-sm mb-5">Select a term and year, then download the official academic report slip for {student?.first_name}.</p>
              <div className="flex gap-2 justify-center mb-5">
                <select value={term} onChange={e => setTerm(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40">
                  <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
                </select>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </div>
              <button onClick={downloadPDF} disabled={downloading} className="flex items-center gap-2 bg-gold text-navy px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gold-600 transition-all disabled:opacity-60 mx-auto">
                {downloading ? <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> : <><Download size={16} /> Download Report</>}
              </button>
            </div>

            {availTerms.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-navy text-sm mb-3">Available Reports</h3>
                <div className="space-y-2">
                  {availTerms.map(t => (
                    <button key={`${t.term}-${t.year}`} onClick={() => { setTerm(t.term.toString()); setYear(t.year.toString()) }} className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${term===t.term.toString()&&year===t.year.toString()?'border-gold bg-gold/5 font-medium text-navy':'border-gray-100 hover:bg-gray-50 text-gray-600'}`}>
                      Term {t.term}, {t.year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
