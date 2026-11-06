import { apiRequest } from './api.js'

const PAGE_SIZE = 20
function cleanStudent(form) {
  return {
    first_name: String(form.first_name || '').trim(),
    last_name: String(form.last_name || '').trim(),
    grade: String(form.grade || '').trim(),
    class_id: form.class_id || null,
    class_name: String(form.class_name || '').trim(),
    date_of_birth: form.date_of_birth || null,
    gender: form.gender || null,
    parent_phone: String(form.parent_phone || '').trim(),
    address: String(form.address || '').trim(),
  }
}
function requireSchool(schoolId) {
  if (!schoolId) throw new Error('Your account is not linked to a school. Sign in through your school directory.')
}
export async function listStudents({ schoolId, search = '', page = 1 }) {
  requireSchool(schoolId)
  const result = await apiRequest('/api/students')
  const term = search.trim().toLowerCase()
  const rows = (result.students || []).filter(s => s.status === 'active' && (!term || [s.first_name,s.last_name,s.student_number,s.class_name].some(v => String(v || '').toLowerCase().includes(term))))
  rows.sort((a,b) => String(a.last_name).localeCompare(String(b.last_name)) || String(a.first_name).localeCompare(String(b.first_name)))
  const from = (Math.max(1,page)-1)*PAGE_SIZE
  return { students: rows.slice(from,from+PAGE_SIZE), total: rows.length }
}
export async function createStudent({ schoolId, form }) {
  requireSchool(schoolId)
  return (await apiRequest('/api/students',{method:'POST',body:JSON.stringify(cleanStudent(form))})).student
}
export async function updateStudent({ schoolId, studentId, form }) {
  requireSchool(schoolId)
  return (await apiRequest('/api/students/'+encodeURIComponent(studentId),{method:'PATCH',body:JSON.stringify(cleanStudent(form))})).student
}
export async function deleteStudent({ schoolId, studentId }) {
  requireSchool(schoolId)
  await apiRequest('/api/students/'+encodeURIComponent(studentId),{method:'DELETE'})
}
