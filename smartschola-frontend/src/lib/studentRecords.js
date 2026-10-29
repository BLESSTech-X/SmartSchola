import { supabase } from './supabase.js'

const PAGE_SIZE = 20
const FIELDS = 'id,school_id,student_number,first_name,last_name,grade,class_name,date_of_birth,gender,parent_phone,address,status,created_at'

function requireSchoolId(schoolId) {
  if (!schoolId) throw new Error('Your account is not linked to a school. Sign out and sign in through your school directory.')
  if (!supabase) throw new Error('SmartSchola is not connected to Supabase. Please try again later.')
}

function cleanStudent(form) {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    grade: String(form.grade).trim(),
    class_name: form.class_name.trim(),
    date_of_birth: form.date_of_birth || null,
    gender: form.gender || null,
    parent_phone: form.parent_phone.trim() || null,
    address: form.address.trim() || null,
  }
}

export async function listStudents({ schoolId, search = '', page = 1 }) {
  requireSchoolId(schoolId)
  const from = (page - 1) * PAGE_SIZE
  let query = supabase.from('students').select(FIELDS, { count: 'exact' })
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .range(from, from + PAGE_SIZE - 1)

  const term = search.trim().replace(/[,%()]/g, ' ')
  if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,student_number.ilike.%${term}%,class_name.ilike.%${term}%`)

  const { data, error, count } = await query
  if (error) throw error
  return { students: data || [], total: count || 0 }
}

export async function createStudent({ schoolId, form }) {
  requireSchoolId(schoolId)
  const payload = { ...cleanStudent(form), school_id: schoolId }
  const { data, error } = await supabase.from('students').insert(payload).select(FIELDS).single()
  if (error) throw error
  return data
}

export async function updateStudent({ schoolId, studentId, form }) {
  requireSchoolId(schoolId)
  const { data, error } = await supabase.from('students').update(cleanStudent(form))
    .eq('school_id', schoolId).eq('id', studentId).select(FIELDS).single()
  if (error) throw error
  return data
}

export async function deleteStudent({ schoolId, studentId }) {
  requireSchoolId(schoolId)
  const { error } = await supabase.from('students').delete()
    .eq('school_id', schoolId).eq('id', studentId)
  if (error) throw error
}
