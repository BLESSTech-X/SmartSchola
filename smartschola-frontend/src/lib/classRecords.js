import { supabase } from './supabase.js'

function ensureReady(schoolId) {
  if (!schoolId) throw new Error('Your account is not linked to a school. Sign in through your school directory.')
  if (!supabase) throw new Error('SmartSchola is not connected to Supabase.')
}

export async function listClasses(schoolId) {
  ensureReady(schoolId)
  const { data, error } = await supabase
    .from('classes')
    .select('id,school_id,name,academic_year_id,class_teacher_id,created_at,academic_years(name)')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function listAcademicYears(schoolId) {
  ensureReady(schoolId)
  const { data, error } = await supabase
    .from('academic_years')
    .select('id,name,starts_on,ends_on,is_current')
    .eq('school_id', schoolId)
    .order('is_current', { ascending: false })
    .order('name', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveClass({ schoolId, classId, name, academicYearId }) {
  ensureReady(schoolId)
  const cleanName = name.trim()
  if (!cleanName) throw new Error('Enter a class name.')
  const payload = { name: cleanName, academic_year_id: academicYearId || null }
  let query = classId
    ? supabase.from('classes').update(payload).eq('id', classId).eq('school_id', schoolId)
    : supabase.from('classes').insert({ ...payload, school_id: schoolId })
  const { data, error } = await query.select('id,school_id,name,academic_year_id,class_teacher_id,created_at').single()
  if (error) throw error
  return data
}

export async function removeClass({ schoolId, classId }) {
  ensureReady(schoolId)
  const { error } = await supabase.from('classes').delete().eq('id', classId).eq('school_id', schoolId)
  if (error) throw error
}
