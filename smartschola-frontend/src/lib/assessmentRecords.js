import { supabase } from './supabase.js'

function ready(schoolId) {
  if (!schoolId) throw new Error('Your account is not linked to a school.')
  if (!supabase) throw new Error('SmartSchola is not connected to Supabase.')
}

export async function listAssessmentClasses(schoolId) {
  ready(schoolId)
  const { data, error } = await supabase.from('classes')
    .select('id,name,academic_year_id')
    .eq('school_id', schoolId).order('name')
  if (error) throw error
  return data || []
}

export async function listAssessmentYears(schoolId) {
  ready(schoolId)
  const { data, error } = await supabase.from('academic_years')
    .select('id,name,is_current').eq('school_id', schoolId)
    .order('is_current', { ascending: false }).order('name', { ascending: false })
  if (error) throw error
  return data || []
}

export async function listAssessments(schoolId, classId = '') {
  ready(schoolId)
  let query = supabase.from('assessments')
    .select('id,school_id,class_id,academic_year_id,name,subject,assessment_type,term,assessment_date,max_score,status,instructions,created_at')
    .eq('school_id', schoolId).order('assessment_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  if (classId) query = query.eq('class_id', classId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createAssessment({ schoolId, classId, academicYearId, name, subject, assessmentType, term, assessmentDate, maxScore, instructions }) {
  ready(schoolId)
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Your session has expired. Sign in again.')
  const payload = {
    school_id: schoolId, class_id: classId, academic_year_id: academicYearId || null,
    name: name.trim(), subject: subject.trim(), assessment_type: assessmentType,
    term: term || null, assessment_date: assessmentDate || null,
    max_score: Number(maxScore), instructions: instructions?.trim() || '',
    created_by: auth.user.id
  }
  const { data, error } = await supabase.from('assessments').insert(payload)
    .select('id,school_id,class_id,academic_year_id,name,subject,assessment_type,term,assessment_date,max_score,status,instructions,created_at').single()
  if (error) throw error
  return data
}

export async function updateAssessmentStatus({ schoolId, assessmentId, status }) {
  ready(schoolId)
  const { data, error } = await supabase.from('assessments').update({ status, updated_at: new Date().toISOString() })
    .eq('school_id', schoolId).eq('id', assessmentId)
    .select('id,status').single()
  if (error) throw error
  return data
}

export async function listClassStudents(schoolId, classId) {
  ready(schoolId)
  const { data, error } = await supabase.from('students')
    .select('id,student_number,first_name,last_name,grade,status')
    .eq('school_id', schoolId).eq('class_id', classId).eq('status', 'active')
    .order('first_name').order('last_name')
  if (error) throw error
  return data || []
}

export async function listAssessmentScores(schoolId, assessmentId) {
  ready(schoolId)
  const { data, error } = await supabase.from('assessment_scores')
    .select('id,student_id,score,remarks')
    .eq('school_id', schoolId).eq('assessment_id', assessmentId)
  if (error) throw error
  return data || []
}

export async function saveAssessmentScores({ schoolId, assessmentId, entries }) {
  ready(schoolId)
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Your session has expired. Sign in again.')
  const rows = entries.map(entry => ({
    school_id: schoolId, assessment_id: assessmentId, student_id: entry.student_id,
    score: entry.score === '' || entry.score === null ? null : Number(entry.score),
    remarks: entry.remarks || '', entered_by: auth.user.id,
    updated_at: new Date().toISOString()
  }))
  if (!rows.length) return []
  const { data, error } = await supabase.from('assessment_scores')
    .upsert(rows, { onConflict: 'assessment_id,student_id' })
    .select('id,student_id,score,remarks')
  if (error) throw error
  return data || []
}

export async function listSchoolTeachers(schoolId) {
  ready(schoolId)
  const { data, error } = await supabase.from('school_memberships')
    .select('id,user_id,login_identifier,role,status,created_at')
    .eq('school_id', schoolId).eq('role', 'teacher').eq('status', 'active')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function listClassTeacherAssignments(schoolId) {
  ready(schoolId)
  const { data, error } = await supabase.from('class_teachers')
    .select('id,class_id,membership_id,created_at')
    .eq('school_id', schoolId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function assignTeacherToClass({ schoolId, classId, membershipId }) {
  ready(schoolId)
  const { error } = await supabase.from('class_teachers')
    .insert({ school_id: schoolId, class_id: classId, membership_id: membershipId })
  if (error) throw error
}

export async function removeTeacherAssignment({ schoolId, assignmentId }) {
  ready(schoolId)
  const { error } = await supabase.from('class_teachers')
    .delete().eq('school_id', schoolId).eq('id', assignmentId)
  if (error) throw error
}
