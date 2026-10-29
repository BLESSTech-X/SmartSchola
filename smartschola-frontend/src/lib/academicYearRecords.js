import { supabase } from './supabase.js'

function ensureReady(schoolId) {
  if (!schoolId) throw new Error('Your account is not linked to a school. Sign in through your school directory.')
  if (!supabase) throw new Error('SmartSchola is not connected to Supabase.')
}

export async function listAcademicYears(schoolId) {
  ensureReady(schoolId)
  const { data, error } = await supabase
    .from('academic_years')
    .select('id,school_id,name,starts_on,ends_on,is_current,created_at')
    .eq('school_id', schoolId)
    .order('is_current', { ascending: false })
    .order('starts_on', { ascending: false, nullsFirst: false })
    .order('name', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveAcademicYear({ schoolId, yearId, name, startsOn, endsOn, isCurrent }) {
  ensureReady(schoolId)
  const cleanName = name.trim()
  if (!cleanName) throw new Error('Enter an academic year name.')
  if (startsOn && endsOn && startsOn > endsOn) throw new Error('The end date must be after the start date.')

  if (isCurrent) {
    const { error: clearError } = await supabase
      .from('academic_years')
      .update({ is_current: false })
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .neq('id', yearId || '00000000-0000-0000-0000-000000000000')
    if (clearError) throw clearError
  }

  const payload = {
    name: cleanName,
    starts_on: startsOn || null,
    ends_on: endsOn || null,
    is_current: Boolean(isCurrent),
  }
  const query = yearId
    ? supabase.from('academic_years').update(payload).eq('id', yearId).eq('school_id', schoolId)
    : supabase.from('academic_years').insert({ ...payload, school_id: schoolId })
  const { data, error } = await query.select('id,school_id,name,starts_on,ends_on,is_current,created_at').single()
  if (error) throw error
  return data
}

export async function setCurrentAcademicYear({ schoolId, yearId }) {
  ensureReady(schoolId)
  const { error: clearError } = await supabase.from('academic_years')
    .update({ is_current: false }).eq('school_id', schoolId).eq('is_current', true).neq('id', yearId)
  if (clearError) throw clearError
  const { data, error } = await supabase.from('academic_years')
    .update({ is_current: true }).eq('school_id', schoolId).eq('id', yearId)
    .select('id,school_id,name,starts_on,ends_on,is_current,created_at').single()
  if (error) throw error
  return data
}

export async function removeAcademicYear({ schoolId, yearId }) {
  ensureReady(schoolId)
  const { count, error: countError } = await supabase.from('classes')
    .select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('academic_year_id', yearId)
  if (countError) throw countError
  if (count > 0) throw new Error('This academic year is assigned to one or more classes. Reassign those classes before deleting it.')
  const { error } = await supabase.from('academic_years').delete().eq('school_id', schoolId).eq('id', yearId)
  if (error) throw error
}
