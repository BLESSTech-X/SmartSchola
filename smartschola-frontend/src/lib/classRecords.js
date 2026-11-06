import { apiRequest } from './api.js'
function ensureReady(schoolId) {
  if (!schoolId) throw new Error('Your account is not linked to a school. Sign in through your school directory.')
}
export async function listClasses(schoolId) {
  ensureReady(schoolId)
  const [classes,years] = await Promise.all([apiRequest('/api/classes'),apiRequest('/api/academic-years')])
  const yearNames = Object.fromEntries((years.academic_years||[]).map(y=>[y.id,y.name]))
  return (classes.classes||[]).map(c=>({...c,academic_years:c.academic_year_id?{name:yearNames[c.academic_year_id]||''}:null}))
}
export async function listAcademicYears(schoolId) {
  ensureReady(schoolId)
  return (await apiRequest('/api/academic-years')).academic_years || []
}
export async function saveClass({ schoolId, classId, name, academicYearId }) {
  ensureReady(schoolId)
  const cleanName=name.trim()
  if(!cleanName) throw new Error('Enter a class name.')
  const payload={name:cleanName,academic_year_id:academicYearId||null}
  const result=await apiRequest(classId?'/api/classes/'+encodeURIComponent(classId):'/api/classes',{method:classId?'PATCH':'POST',body:JSON.stringify(payload)})
  return result.class
}
export async function removeClass({ schoolId, classId }) {
  ensureReady(schoolId)
  await apiRequest('/api/classes/'+encodeURIComponent(classId),{method:'DELETE'})
}
