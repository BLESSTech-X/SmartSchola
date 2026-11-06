import { apiRequest } from './api.js'
function ensureReady(schoolId) {
  if (!schoolId) throw new Error('Your account is not linked to a school. Sign in through your school directory.')
}
export async function listAcademicYears(schoolId) {
  ensureReady(schoolId)
  return (await apiRequest('/api/academic-years')).academic_years || []
}
export async function saveAcademicYear({ schoolId, yearId, name, startsOn, endsOn, isCurrent }) {
  ensureReady(schoolId)
  const cleanName=name.trim()
  if(!cleanName) throw new Error('Enter an academic year name.')
  if(startsOn&&endsOn&&startsOn>endsOn) throw new Error('The end date must be after the start date.')
  const payload={name:cleanName,starts_on:startsOn||null,ends_on:endsOn||null,is_current:Boolean(isCurrent)}
  const result=await apiRequest(yearId?'/api/academic-years/'+encodeURIComponent(yearId):'/api/academic-years',{method:yearId?'PATCH':'POST',body:JSON.stringify(payload)})
  return result.academic_year
}
export async function setCurrentAcademicYear({ schoolId, yearId }) {
  ensureReady(schoolId)
  const rows=await listAcademicYears(schoolId)
  const current=rows.find(y=>y.id===yearId)
  if(!current) throw new Error('Academic year not found.')
  const result=await apiRequest('/api/academic-years/'+encodeURIComponent(yearId),{method:'PATCH',body:JSON.stringify({name:current.name,starts_on:current.starts_on,ends_on:current.ends_on,is_current:true})})
  return result.academic_year
}
export async function removeAcademicYear({ schoolId, yearId }) {
  ensureReady(schoolId)
  await apiRequest('/api/academic-years/'+encodeURIComponent(yearId),{method:'DELETE'})
}
