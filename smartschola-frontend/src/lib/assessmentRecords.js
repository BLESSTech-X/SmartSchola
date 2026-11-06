import { apiRequest } from './api.js'
function ready(schoolId) {
  if (!schoolId) throw new Error('Your account is not linked to a school.')
}
export async function listAssessmentClasses(schoolId) {
  ready(schoolId)
  return (await apiRequest('/api/classes')).classes || []
}
export async function listAssessmentYears(schoolId) {
  ready(schoolId)
  return (await apiRequest('/api/academic-years')).academic_years || []
}
export async function listAssessments(schoolId,classId='') {
  ready(schoolId)
  const rows=(await apiRequest('/api/assessments')).assessments||[]
  return classId?rows.filter(x=>x.class_id===classId):rows
}
export async function createAssessment({schoolId,classId,academicYearId,name,subject,assessmentType,term,assessmentDate,maxScore,instructions}) {
  ready(schoolId)
  const result=await apiRequest('/api/assessments',{method:'POST',body:JSON.stringify({class_id:classId,academic_year_id:academicYearId||null,name:name.trim(),subject:subject.trim(),assessment_type:assessmentType,term:term||null,assessment_date:assessmentDate||null,max_score:Number(maxScore),instructions:instructions?.trim()||''})})
  return result.assessment
}
export async function updateAssessmentStatus({schoolId,assessmentId,status}) {
  ready(schoolId)
  return apiRequest('/api/assessments/'+encodeURIComponent(assessmentId),{method:'PATCH',body:JSON.stringify({status})})
}
export async function listClassStudents(schoolId,classId) {
  ready(schoolId)
  return ((await apiRequest('/api/students')).students||[]).filter(s=>s.class_id===classId&&s.status==='active').sort((a,b)=>String(a.first_name).localeCompare(String(b.first_name)))
}
export async function listAssessmentScores(schoolId,assessmentId) {
  ready(schoolId)
  return (await apiRequest('/api/assessments/'+encodeURIComponent(assessmentId)+'/scores')).scores||[]
}
export async function saveAssessmentScores({schoolId,assessmentId,entries}) {
  ready(schoolId)
  if(!entries.length)return []
  const result=await apiRequest('/api/assessments/'+encodeURIComponent(assessmentId)+'/scores',{method:'POST',body:JSON.stringify({scores:entries})})
  return entries.map(x=>({...x}))
}
export async function listSchoolTeachers(schoolId) {
  ready(schoolId)
  return (await apiRequest('/api/school-teachers')).teachers||[]
}
export async function listClassTeacherAssignments(schoolId) {
  ready(schoolId)
  return (await apiRequest('/api/class-teachers')).assignments||[]
}
export async function assignTeacherToClass({schoolId,classId,membershipId}) {
  ready(schoolId)
  await apiRequest('/api/class-teachers',{method:'POST',body:JSON.stringify({class_id:classId,membership_id:membershipId})})
}
export async function removeTeacherAssignment({schoolId,assignmentId}) {
  ready(schoolId)
  await apiRequest('/api/class-teachers/'+encodeURIComponent(assignmentId),{method:'DELETE'})
}
