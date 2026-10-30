import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, Plus, Save, Users, BookOpen, CalendarDays, CheckCircle2, AlertCircle, Trash2, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import {
  listAssessmentClasses, listAssessmentYears, listAssessments, createAssessment,
  updateAssessmentStatus, listClassStudents, listAssessmentScores, saveAssessmentScores,
  listSchoolTeachers, listClassTeacherAssignments, assignTeacherToClass, removeTeacherAssignment
} from '../lib/assessmentRecords.js'

const TYPES = [
  ['class_test', 'Class test'], ['homework', 'Homework'], ['quiz', 'Quiz'],
  ['mid_term', 'Mid-term examination'], ['end_term', 'End-term examination'],
  ['project', 'Project'], ['practical', 'Practical'], ['other', 'Other']
]
const EMPTY_ASSESSMENT = { class_id: '', academic_year_id: '', name: '', subject: '', assessment_type: 'class_test', term: 'Term 1', assessment_date: '', max_score: '100', instructions: '' }

export default function MarkEntry() {
  const { currentUser } = useAuth()
  const { addToast } = useToast()
  const schoolId = currentUser?.school_id
  const isAdmin = ['headmaster', 'admin'].includes(currentUser?.role)
  const [tab, setTab] = useState('assessments')
  const [classes, setClasses] = useState([])
  const [years, setYears] = useState([])
  const [assessments, setAssessments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_ASSESSMENT)
  const [savingAssessment, setSavingAssessment] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [loadingMarks, setLoadingMarks] = useState(false)
  const [savingMarks, setSavingMarks] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({ class_id: '', membership_id: '' })
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [removingAssignment, setRemovingAssignment] = useState(null)

  const loadBase = useCallback(async () => {
    if (!schoolId) { setLoading(false); return }
    setLoading(true)
    try {
      const [classRows, yearRows, assessmentRows] = await Promise.all([
        listAssessmentClasses(schoolId), listAssessmentYears(schoolId), listAssessments(schoolId)
      ])
      setClasses(classRows)
      setYears(yearRows)
      setAssessments(assessmentRows)
      setForm(current => ({ ...current, academic_year_id: current.academic_year_id || yearRows.find(y => y.is_current)?.id || '', class_id: current.class_id || classRows[0]?.id || '' }))
      if (isAdmin) {
        const [teacherRows, assignmentRows] = await Promise.all([
          listSchoolTeachers(schoolId), listClassTeacherAssignments(schoolId)
        ])
        setTeachers(teacherRows)
        setAssignments(assignmentRows)
        setAssignmentForm(current => ({ ...current, class_id: current.class_id || classRows[0]?.id || '', membership_id: current.membership_id || teacherRows[0]?.id || '' }))
      }
    } catch (error) { addToast(error.message || 'Could not load assessment records', 'error') }
    finally { setLoading(false) }
  }, [schoolId, isAdmin, addToast])

  useEffect(() => { loadBase() }, [loadBase])

  const className = useMemo(() => Object.fromEntries(classes.map(item => [item.id, item.name])), [classes])
  const teacherLabel = teacher => teacher.login_identifier || `Teacher account · ${teacher.user_id.slice(0, 8)}…`
  const assignmentRows = assignments.map(item => ({
    ...item,
    className: className[item.class_id] || 'Class unavailable',
    teacher: teachers.find(teacher => teacher.id === item.membership_id)
  }))

  const handleCreateAssessment = async event => {
    event.preventDefault()
    if (!form.class_id || !form.name.trim() || !form.subject.trim() || Number(form.max_score) <= 0) {
      addToast('Complete the class, assessment name, subject and maximum score.', 'warning')
      return
    }
    setSavingAssessment(true)
    try {
      await createAssessment({
        schoolId, classId: form.class_id, academicYearId: form.academic_year_id,
        name: form.name, subject: form.subject, assessmentType: form.assessment_type,
        term: form.term, assessmentDate: form.assessment_date,
        maxScore: form.max_score, instructions: form.instructions
      })
      addToast('Assessment created successfully.', 'success')
      setShowCreate(false)
      setForm({ ...EMPTY_ASSESSMENT, class_id: form.class_id, academic_year_id: form.academic_year_id })
      await loadBase()
    } catch (error) { addToast(error.message || 'Could not create assessment', 'error') }
    finally { setSavingAssessment(false) }
  }

  const openMarkSheet = async assessment => {
    setSelectedAssessment(assessment)
    setLoadingMarks(true)
    setTab('assessments')
    try {
      const [studentRows, scoreRows] = await Promise.all([
        listClassStudents(schoolId, assessment.class_id),
        listAssessmentScores(schoolId, assessment.id)
      ])
      const scoreMap = Object.fromEntries(scoreRows.map(row => [row.student_id, { score: row.score === null ? '' : String(row.score), remarks: row.remarks || '' }]))
      setStudents(studentRows)
      setMarks(Object.fromEntries(studentRows.map(student => [student.id, scoreMap[student.id] || { score: '', remarks: '' }])))
    } catch (error) {
      setStudents([])
      setMarks({})
      addToast(error.message || 'Could not load the class mark sheet', 'error')
    } finally { setLoadingMarks(false) }
  }

  const updateMark = (studentId, field, value) => {
    setMarks(previous => ({ ...previous, [studentId]: { ...(previous[studentId] || { score: '', remarks: '' }), [field]: value } }))
  }

  const handleSaveMarks = async () => {
    if (!selectedAssessment) return
    const entries = students.map(student => ({
      student_id: student.id,
      score: marks[student.id]?.score ?? '',
      remarks: marks[student.id]?.remarks || ''
    }))
    const invalid = entries.find(entry => entry.score !== '' && (!Number.isFinite(Number(entry.score)) || Number(entry.score) < 0 || Number(entry.score) > Number(selectedAssessment.max_score)))
    if (invalid) {
      addToast(`Each score must be between 0 and ${selectedAssessment.max_score}.`, 'warning')
      return
    }
    setSavingMarks(true)
    try {
      const saved = await saveAssessmentScores({ schoolId, assessmentId: selectedAssessment.id, entries })
      addToast(`Saved marks for ${saved.length} learners.`, 'success')
    } catch (error) { addToast(error.message || 'Could not save marks', 'error') }
    finally { setSavingMarks(false) }
  }

  const handleStatus = async assessment => {
    const status = assessment.status === 'published' ? 'draft' : 'published'
    try {
      await updateAssessmentStatus({ schoolId, assessmentId: assessment.id, status })
      addToast(status === 'published' ? 'Assessment published.' : 'Assessment returned to draft.', 'success')
      await loadBase()
      if (selectedAssessment?.id === assessment.id) setSelectedAssessment(current => ({ ...current, status }))
    } catch (error) { addToast(error.message || 'Could not update assessment status', 'error') }
  }

  const handleAssign = async event => {
    event.preventDefault()
    if (!assignmentForm.class_id || !assignmentForm.membership_id) {
      addToast('Choose a class and an active teacher.', 'warning')
      return
    }
    setSavingAssignment(true)
    try {
      await assignTeacherToClass({ schoolId, classId: assignmentForm.class_id, membershipId: assignmentForm.membership_id })
      addToast('Teacher assigned to class.', 'success')
      await loadBase()
    } catch (error) { addToast(error.message || 'Could not assign teacher', 'error') }
    finally { setSavingAssignment(false) }
  }

  const handleRemoveAssignment = async assignment => {
    if (!window.confirm('Remove this teacher from the class? They will lose access to manage its assessments and marks.')) return
    setRemovingAssignment(assignment.id)
    try {
      await removeTeacherAssignment({ schoolId, assignmentId: assignment.id })
      addToast('Teacher assignment removed.', 'success')
      await loadBase()
    } catch (error) { addToast(error.message || 'Could not remove assignment', 'error') }
    finally { setRemovingAssignment(null) }
  }

  const filteredAssessments = assessments.filter(item => !classFilter || item.class_id === classFilter)

  return (
    <div className="p-6">
      <PageHeader title="Assessments & Mark Entry" subtitle="Create class assessments, manage teaching assignments and record learner performance." />
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setTab('assessments')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${tab === 'assessments' ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'}`} style={tab === 'assessments' ? { background: '#0B1D3A' } : {}}><ClipboardList size={16}/> Assessments & Marks</button>
        {isAdmin && <button onClick={() => setTab('assignments')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${tab === 'assignments' ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'}`} style={tab === 'assignments' ? { background: '#0B1D3A' } : {}}><Users size={16}/> Teacher Assignments</button>}
      </div>

      {loading ? <div className="bg-white rounded-2xl p-16 flex justify-center"><LoadingSpinner size={30}/></div> : tab === 'assignments' && isAdmin ? (
        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1"><Users size={19} className="text-blue-700"/><h2 className="font-bold text-gray-800">Assign a teacher to a class</h2></div>
            <p className="text-sm text-gray-500 mb-4">Only active teacher accounts belonging to this school can be assigned. Assignments control which classes teachers can manage.</p>
            {teachers.length === 0 ? <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">There are no active teacher memberships yet. Add or activate a teacher account before making an assignment.</div> : (
              <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                <select value={assignmentForm.class_id} onChange={e => setAssignmentForm(v => ({ ...v, class_id: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm"><option value="">Choose class</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <select value={assignmentForm.membership_id} onChange={e => setAssignmentForm(v => ({ ...v, membership_id: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm"><option value="">Choose teacher</option>{teachers.map(item => <option key={item.id} value={item.id}>{teacherLabel(item)}</option>)}</select>
                <button disabled={savingAssignment || !classes.length} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: '#0B1D3A' }}>{savingAssignment ? <LoadingSpinner size={14} color="white"/> : <Plus size={16}/>} Assign teacher</button>
              </form>
            )}
          </section>
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-gray-800">Current teaching assignments</h2><p className="text-xs text-gray-400 mt-1">{assignmentRows.length} active class assignments</p></div>
            {assignmentRows.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No teachers have been assigned to classes yet.</div> : <div className="divide-y divide-gray-100">{assignmentRows.map(item => <div key={item.id} className="px-5 py-4 flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><BookOpen size={18}/></span><div className="flex-1 min-w-0"><p className="font-semibold text-sm text-gray-800">{item.className}</p><p className="text-xs text-gray-500 mt-0.5">{item.teacher ? teacherLabel(item.teacher) : 'Teacher membership unavailable'}</p></div><button onClick={() => handleRemoveAssignment(item)} disabled={removingAssignment === item.id} className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50" title="Remove assignment">{removingAssignment === item.id ? <LoadingSpinner size={15}/> : <Trash2 size={16}/>}</button></div>)}</div>}
          </section>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div><h2 className="font-bold text-gray-800">Assessment register</h2><p className="text-xs text-gray-400 mt-1">{assessments.length} assessments in this school</p></div>
              <button onClick={() => setShowCreate(value => !value)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#0B1D3A' }}><Plus size={16}/>{showCreate ? 'Close form' : 'Create assessment'}</button>
            </div>
            {showCreate && <form onSubmit={handleCreateAssessment} className="mb-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h3 className="font-semibold text-sm text-gray-800 mb-3">New assessment details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-gray-500">Class<select required value={form.class_id} onChange={e => setForm(v => ({ ...v, class_id: e.target.value }))} className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal"><option value="">Select class</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className="text-xs font-semibold text-gray-500">Academic year<select value={form.academic_year_id} onChange={e => setForm(v => ({ ...v, academic_year_id: e.target.value }))} className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal"><option value="">Not specified</option>{years.map(item => <option key={item.id} value={item.id}>{item.name}{item.is_current ? ' · Current' : ''}</option>)}</select></label>
                <label className="text-xs font-semibold text-gray-500">Assessment name<input required minLength="2" maxLength="160" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} placeholder="e.g. Mid-term test" className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal"/></label>
                <label className="text-xs font-semibold text-gray-500">Subject<input required maxLength="100" value={form.subject} onChange={e => setForm(v => ({ ...v, subject: e.target.value }))} placeholder="e.g. Mathematics" className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal"/></label>
                <label className="text-xs font-semibold text-gray-500">Assessment type<select value={form.assessment_type} onChange={e => setForm(v => ({ ...v, assessment_type: e.target.value }))} className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal">{TYPES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-xs font-semibold text-gray-500">Term<input value={form.term} onChange={e => setForm(v => ({ ...v, term: e.target.value }))} placeholder="Term 1" className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal"/></label>
                <label className="text-xs font-semibold text-gray-500">Assessment date<input type="date" value={form.assessment_date} onChange={e => setForm(v => ({ ...v, assessment_date: e.target.value }))} className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal"/></label>
                <label className="text-xs font-semibold text-gray-500">Maximum score<input required type="number" min="0.01" step="0.01" value={form.max_score} onChange={e => setForm(v => ({ ...v, max_score: e.target.value }))} className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal"/></label>
                <label className="text-xs font-semibold text-gray-500 md:col-span-2 lg:col-span-3">Instructions (optional)<textarea rows="2" value={form.instructions} onChange={e => setForm(v => ({ ...v, instructions: e.target.value }))} className="mt-1 block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-normal" placeholder="Notes for teachers or learners"/></label>
              </div>
              <div className="flex justify-end mt-4"><button disabled={savingAssessment || !classes.length} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50" style={{ background: '#0B1D3A' }}>{savingAssessment ? <LoadingSpinner size={14} color="white"/> : <CheckCircle2 size={16}/>} Save assessment</button></div>
            </form>}
            <div className="flex flex-wrap items-center gap-3 mb-3"><label className="text-xs font-semibold text-gray-500">Filter by class</label><select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm"><option value="">All classes</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={loadBase} className="ml-auto text-xs text-blue-700 flex items-center gap-1"><RefreshCw size={13}/> Refresh</button></div>
            {filteredAssessments.length === 0 ? <div className="py-10 text-center"><ClipboardList size={28} className="mx-auto text-gray-300 mb-2"/><p className="font-semibold text-sm text-gray-700">No assessments found</p><p className="text-xs text-gray-400 mt-1">Create an assessment for one of your school classes to begin.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px]"><thead><tr className="border-y border-gray-100 text-left">{['Assessment','Class','Subject / Term','Date','Maximum','Status','Actions'].map(label => <th key={label} className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</th>)}</tr></thead><tbody>{filteredAssessments.map(item => <tr key={item.id} className="border-b border-gray-50"><td className="px-3 py-3"><p className="font-semibold text-sm text-gray-800">{item.name}</p><p className="text-xs text-gray-400 mt-0.5">{TYPES.find(type => type[0] === item.assessment_type)?.[1] || item.assessment_type}</p></td><td className="px-3 py-3 text-sm text-gray-600">{className[item.class_id] || '—'}</td><td className="px-3 py-3 text-sm text-gray-600">{item.subject}<p className="text-xs text-gray-400">{item.term || 'No term'}</p></td><td className="px-3 py-3 text-xs text-gray-500">{item.assessment_date || '—'}</td><td className="px-3 py-3 text-sm text-gray-600">{item.max_score}</td><td className="px-3 py-3"><span className={`px-2 py-1 rounded-full text-[11px] font-bold ${item.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span></td><td className="px-3 py-3"><div className="flex items-center gap-2"><button onClick={() => openMarkSheet(item)} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">Enter marks</button>{isAdmin && <button onClick={() => handleStatus(item)} className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600">{item.status === 'published' ? 'Unpublish' : 'Publish'}</button>}</div></td></tr>)}</tbody></table></div>}
          </section>

          {selectedAssessment && <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><ClipboardList size={18} className="text-blue-700"/><h2 className="font-bold text-gray-800">{selectedAssessment.name} · Mark sheet</h2></div><p className="text-xs text-gray-500 mt-1">{className[selectedAssessment.class_id]} · {selectedAssessment.subject} · Maximum {selectedAssessment.max_score} marks</p></div><button onClick={handleSaveMarks} disabled={savingMarks || loadingMarks || students.length === 0} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50" style={{ background: '#0B1D3A' }}>{savingMarks ? <LoadingSpinner size={14} color="white"/> : <Save size={15}/>} Save marks</button></div>
            {loadingMarks ? <div className="p-12 flex justify-center"><LoadingSpinner size={28}/></div> : students.length === 0 ? <div className="p-8 text-center"><AlertCircle size={25} className="mx-auto text-amber-500 mb-2"/><p className="text-sm font-semibold text-gray-700">No active students are assigned to this class.</p><p className="text-xs text-gray-400 mt-1">Add learners to the class in the Students section, then reload this assessment.</p></div> : <><div className="px-5 py-3 bg-blue-50/60 text-xs text-blue-800">Enter scores from 0 to {selectedAssessment.max_score}. Leave a score blank if the learner has not been assessed. Changes are saved to this school’s secure records.</div><div className="overflow-x-auto"><table className="w-full min-w-[620px]"><thead><tr className="border-b border-gray-100 text-left">{['#','Student','Student number','Score','Remarks'].map(label => <th key={label} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</th>)}</tr></thead><tbody>{students.map((student,index) => <tr key={student.id} className="border-b border-gray-50"><td className="px-4 py-3 text-xs text-gray-400">{index+1}</td><td className="px-4 py-3 text-sm font-semibold text-gray-800">{student.first_name} {student.last_name}</td><td className="px-4 py-3 text-xs text-gray-500">{student.student_number}</td><td className="px-4 py-3"><input type="number" min="0" max={selectedAssessment.max_score} step="0.01" value={marks[student.id]?.score ?? ''} onChange={e => updateMark(student.id,'score',e.target.value)} className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400" placeholder="—"/></td><td className="px-4 py-3"><input value={marks[student.id]?.remarks ?? ''} onChange={e => updateMark(student.id,'remarks',e.target.value)} className="w-full min-w-44 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400" placeholder="Optional teacher comment"/></td></tr>)}</tbody></table></div><div className="p-4 flex justify-end"><button onClick={handleSaveMarks} disabled={savingMarks} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50" style={{ background: '#0B1D3A' }}>{savingMarks ? <LoadingSpinner size={14} color="white"/> : <Save size={15}/>} Save marks</button></div></>}
          </section>}
          {classes.length === 0 && <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 flex gap-2"><CalendarDays size={17}/> Create at least one class before setting up assessments.</div>}
        </div>
      )}
    </div>
  )
}
