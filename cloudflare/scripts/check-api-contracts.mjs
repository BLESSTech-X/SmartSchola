import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const worker = read('cloudflare/src/index.js')
const checks = [
  ['profile save route', 'smartschola-frontend/src/pages/ProfileSettings.jsx', '/api/profile', 'if(p==="/api/profile"'],
  ['school logo settings route', 'smartschola-frontend/src/pages/SchoolWebsite.jsx', '/api/school/branding', 'if(p==="/api/school/branding"'],
  ['public teacher registration route', 'smartschola-frontend/src/pages/SchoolJoin.jsx', '/teacher-applications', 'publicTeacherApply'],
  ['public learner registration route', 'smartschola-frontend/src/pages/SchoolJoin.jsx', '/student-applications', 'publicStudentApply'],
  ['school registration options route', 'smartschola-frontend/src/pages/SchoolJoin.jsx', '/join-options', 'joinOptionsRoute'],
  ['teacher review route', 'smartschola-frontend/src/pages/TeacherManagement.jsx', '/api/teacher-applications/', 'teacherApplicationReview'],
  ['learner teacher-review route', 'smartschola-frontend/src/pages/LearnerRequests.jsx', '/api/teacher/student-enrollment-requests', 'studentRequestReview'],
  ['teacher notification route', 'smartschola-frontend/src/pages/TeacherManagement.jsx', '/api/teacher-notifications', 'if(p==="/api/teacher-notifications"'],
  ['notification inbox route', 'smartschola-frontend/src/pages/RoleDashboards.jsx', '/api/notifications', 'if(p==="/api/notifications"'],
  ['assessment class-assignment route', 'smartschola-frontend/src/lib/assessmentRecords.js', '/api/teacher-assignments', 'if(p==="/api/teacher-assignments"'],
  ['fee payment-history route', 'smartschola-frontend/src/pages/FeeTracker.jsx', '/api/fees/invoices/', 'invoicePaymentRoute']
]
let failures = 0
for (const [label, frontendPath, frontendNeedle, workerNeedle] of checks) {
  const frontend = read(frontendPath)
  if (!frontend.includes(frontendNeedle) || !worker.includes(workerNeedle)) {
    console.error('FAIL:', label)
    failures++
  } else console.log('PASS:', label)
}
const m3 = read('cloudflare/migrations/0003_school_operations.sql')
const m4 = read('cloudflare/migrations/0004_settings_and_messaging.sql')
const m5 = read('cloudflare/migrations/0005_profiles_website_admissions.sql')
const m6 = read('cloudflare/migrations/0006_recruitment_and_notifications.sql')
if (!m3.includes('sms_provider') || /ALTER TABLE school_settings ADD COLUMN sms_provider/i.test(m4)) {
  console.error('FAIL: SMS migration reconciliation would re-add an existing column.')
  failures++
} else console.log('PASS: SMS schema reconciliation')
for (const [label, source, required] of [
  ['profile and logo schema', m5, ['avatar_data', 'logo_data', 'school_website_content']],
  ['recruitment and notification schema', m6, ['teacher_application_details', 'student_enrollment_requests', 'school_notifications']]
]) {
  if (required.some(value => !source.includes(value))) {
    console.error('FAIL:', label)
    failures++
  } else console.log('PASS:', label)
}
if (failures) {
  console.error(`SmartSchola contract checks failed: ${failures}`)
  process.exitCode = 1
} else console.log('SmartSchola API and migration contract checks passed.')
