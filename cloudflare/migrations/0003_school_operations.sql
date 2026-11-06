-- SmartSchola extended school operations and commercial modules.
-- All school-owned records carry school_id and composite foreign keys where practical.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS terms (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id TEXT NOT NULL,
  name TEXT NOT NULL,
  starts_on TEXT,
  ends_on TEXT,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK(is_current IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,academic_year_id,name),
  UNIQUE(id,school_id),
  FOREIGN KEY(academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  CHECK(starts_on IS NULL OR ends_on IS NULL OR starts_on<=ends_on)
);
CREATE UNIQUE INDEX IF NOT EXISTS terms_one_current_per_school ON terms(school_id) WHERE is_current=1;
CREATE INDEX IF NOT EXISTS terms_year_idx ON terms(school_id,academic_year_id);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,name),
  UNIQUE(school_id,code),
  UNIQUE(id,school_id)
);

CREATE TABLE IF NOT EXISTS class_subjects (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  teacher_membership_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,class_id,subject_id),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE CASCADE,
  FOREIGN KEY(subject_id,school_id) REFERENCES subjects(id,school_id) ON DELETE CASCADE,
  FOREIGN KEY(teacher_membership_id,school_id) REFERENCES school_memberships(id,school_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  academic_year_id TEXT,
  term_id TEXT,
  attendance_date TEXT NOT NULL,
  session_label TEXT NOT NULL DEFAULT 'Daily',
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','submitted','locked')),
  notes TEXT NOT NULL DEFAULT '',
  recorded_by TEXT NOT NULL REFERENCES users(id),
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,class_id,attendance_date,session_label),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('present','absent','late','excused')),
  arrival_time TEXT,
  remarks TEXT NOT NULL DEFAULT '',
  recorded_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(session_id,student_id),
  FOREIGN KEY(session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS attendance_records_student_date_idx ON attendance_records(school_id,student_id,created_at DESC);
CREATE INDEX IF NOT EXISTS attendance_sessions_class_date_idx ON attendance_sessions(school_id,class_id,attendance_date DESC);

CREATE TABLE IF NOT EXISTS fee_structures (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id TEXT,
  term_id TEXT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount_minor INTEGER NOT NULL CHECK(amount_minor>=0),
  currency TEXT NOT NULL DEFAULT 'ZMW',
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK(applies_to IN ('all','class','student')),
  class_id TEXT,
  due_on TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS fee_structures_school_active_idx ON fee_structures(school_id,is_active);

CREATE TABLE IF NOT EXISTS student_invoices (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  academic_year_id TEXT,
  term_id TEXT,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  subtotal_minor INTEGER NOT NULL DEFAULT 0 CHECK(subtotal_minor>=0),
  discount_minor INTEGER NOT NULL DEFAULT 0 CHECK(discount_minor>=0),
  total_minor INTEGER NOT NULL CHECK(total_minor>=0),
  paid_minor INTEGER NOT NULL DEFAULT 0 CHECK(paid_minor>=0),
  currency TEXT NOT NULL DEFAULT 'ZMW',
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('draft','unpaid','partial','paid','void','overdue')),
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,invoice_number),
  UNIQUE(id,school_id),
  FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE RESTRICT,
  CHECK(discount_minor<=subtotal_minor),
  CHECK(paid_minor<=total_minor)
);
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  fee_structure_id TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity>0),
  unit_amount_minor INTEGER NOT NULL CHECK(unit_amount_minor>=0),
  line_total_minor INTEGER NOT NULL CHECK(line_total_minor>=0),
  FOREIGN KEY(invoice_id,school_id) REFERENCES student_invoices(id,school_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS fee_payments (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
  currency TEXT NOT NULL DEFAULT 'ZMW',
  method TEXT NOT NULL CHECK(method IN ('cash','mobile_money','bank','card','other')),
  reference TEXT,
  paid_at TEXT NOT NULL,
  received_by TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('pending','confirmed','reversed')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,receipt_number),
  FOREIGN KEY(invoice_id,school_id) REFERENCES student_invoices(id,school_id) ON DELETE RESTRICT,
  FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS fee_payments_invoice_idx ON fee_payments(school_id,invoice_id,paid_at DESC);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'school' CHECK(audience IN ('public','school','staff','students','parents','class')),
  class_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  publish_at TEXT,
  expires_at TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS announcements_feed_idx ON announcements(school_id,status,publish_at DESC);

CREATE TABLE IF NOT EXISTS school_events (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  visibility TEXT NOT NULL DEFAULT 'school' CHECK(visibility IN ('public','school','staff','students','parents')),
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','cancelled')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(ends_at IS NULL OR starts_at<=ends_at)
);
CREATE INDEX IF NOT EXISTS school_events_calendar_idx ON school_events(school_id,starts_at);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  action_url TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS notifications_inbox_idx ON notifications(user_id,read_at,created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS audit_events_school_date_idx ON audit_events(school_id,created_at DESC);

CREATE TABLE IF NOT EXISTS school_settings (
  school_id TEXT PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'Africa/Lusaka',
  currency TEXT NOT NULL DEFAULT 'ZMW',
  locale TEXT NOT NULL DEFAULT 'en-ZM',
  academic_year_label TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  website TEXT,
  branding_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS timetable_entries (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  subject_id TEXT,
  teacher_membership_id TEXT,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  room TEXT NOT NULL DEFAULT '',
  academic_year_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE CASCADE,
  FOREIGN KEY(subject_id,school_id) REFERENCES subjects(id,school_id) ON DELETE RESTRICT,
  FOREIGN KEY(teacher_membership_id,school_id) REFERENCES school_memberships(id,school_id) ON DELETE RESTRICT,
  CHECK(starts_at<ends_at)
);
CREATE INDEX IF NOT EXISTS timetable_class_day_idx ON timetable_entries(school_id,class_id,day_of_week,starts_at);

CREATE TABLE IF NOT EXISTS admissions_enquiries (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  guardian_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  student_name TEXT,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','accepted','declined','closed')),
  assigned_to TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS admissions_school_status_idx ON admissions_enquiries(school_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_minor INTEGER NOT NULL DEFAULT 0 CHECK(price_minor>=0),
  currency TEXT NOT NULL DEFAULT 'ZMW',
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK(billing_interval IN ('monthly','termly','yearly')),
  limits_json TEXT NOT NULL DEFAULT '{}',
  features_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1))
);
CREATE TABLE IF NOT EXISTS school_subscriptions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trial' CHECK(status IN ('trial','pending','active','past_due','suspended','cancelled','expired')),
  starts_at TEXT,
  ends_at TEXT,
  grace_until TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS subscriptions_school_status_idx ON school_subscriptions(school_id,status);

CREATE TABLE IF NOT EXISTS subscription_payment_submissions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES school_subscriptions(id) ON DELETE SET NULL,
  amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
  currency TEXT NOT NULL DEFAULT 'ZMW',
  payment_method TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','approved','rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS subscription_submissions_school_idx ON subscription_payment_submissions(school_id,status,created_at DESC);

-- Tenant-safe composite link validation for tables whose parent tables are school-scoped.
CREATE TRIGGER IF NOT EXISTS terms_year_school_insert BEFORE INSERT ON terms
WHEN NOT EXISTS(SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Academic year must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS terms_year_school_update BEFORE UPDATE OF school_id,academic_year_id ON terms
WHEN NOT EXISTS(SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Academic year must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS class_subject_teacher_validate_insert BEFORE INSERT ON class_subjects
WHEN NEW.teacher_membership_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM school_memberships m WHERE m.id=NEW.teacher_membership_id AND m.school_id=NEW.school_id AND m.role='teacher' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Subject teacher must be an active teacher in this school'); END;
CREATE TRIGGER IF NOT EXISTS attendance_session_year_validate_insert BEFORE INSERT ON attendance_sessions
WHEN NEW.academic_year_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Attendance year must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS attendance_session_term_validate_insert BEFORE INSERT ON attendance_sessions
WHEN NEW.term_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM terms t WHERE t.id=NEW.term_id AND t.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Attendance term must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS attendance_record_validate_insert BEFORE INSERT ON attendance_records
WHEN NOT EXISTS(SELECT 1 FROM attendance_sessions a JOIN students s ON s.id=NEW.student_id AND s.school_id=NEW.school_id WHERE a.id=NEW.session_id AND a.school_id=NEW.school_id AND s.class_id=a.class_id)
BEGIN SELECT RAISE(ABORT,'Attendance student must belong to the session class and school'); END;
CREATE TRIGGER IF NOT EXISTS attendance_record_validate_update BEFORE UPDATE OF session_id,student_id,school_id ON attendance_records
WHEN NOT EXISTS(SELECT 1 FROM attendance_sessions a JOIN students s ON s.id=NEW.student_id AND s.school_id=NEW.school_id WHERE a.id=NEW.session_id AND a.school_id=NEW.school_id AND s.class_id=a.class_id)
BEGIN SELECT RAISE(ABORT,'Attendance student must belong to the session class and school'); END;
CREATE TRIGGER IF NOT EXISTS invoice_payment_validate_insert BEFORE INSERT ON fee_payments
WHEN NOT EXISTS(SELECT 1 FROM student_invoices i WHERE i.id=NEW.invoice_id AND i.school_id=NEW.school_id AND i.student_id=NEW.student_id)
BEGIN SELECT RAISE(ABORT,'Payment must match the invoice student and school'); END;

-- Additional cross-tenant guards for financial and timetable records.

CREATE TRIGGER IF NOT EXISTS fee_structure_year_school_insert BEFORE INSERT ON fee_structures
WHEN NEW.academic_year_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Fee structure academic year must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS fee_structure_term_school_insert BEFORE INSERT ON fee_structures
WHEN NEW.term_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM terms t WHERE t.id=NEW.term_id AND t.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Fee structure term must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS invoice_year_school_insert BEFORE INSERT ON student_invoices
WHEN NEW.academic_year_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Invoice academic year must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS invoice_term_school_insert BEFORE INSERT ON student_invoices
WHEN NEW.term_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM terms t WHERE t.id=NEW.term_id AND t.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Invoice term must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS timetable_subject_school_insert BEFORE INSERT ON timetable_entries
WHEN NEW.subject_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM subjects s WHERE s.id=NEW.subject_id AND s.school_id=NEW.school_id)
BEGIN SELECT RAISE(ABORT,'Timetable subject must belong to the same school'); END;
CREATE TRIGGER IF NOT EXISTS timetable_teacher_school_insert BEFORE INSERT ON timetable_entries
WHEN NEW.teacher_membership_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM school_memberships m WHERE m.id=NEW.teacher_membership_id AND m.school_id=NEW.school_id AND m.role='teacher' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Timetable teacher must be active in the same school'); END;

CREATE TRIGGER IF NOT EXISTS fee_payment_balance_guard BEFORE INSERT ON fee_payments
WHEN NOT EXISTS(SELECT 1 FROM student_invoices i WHERE i.id=NEW.invoice_id AND i.school_id=NEW.school_id AND i.student_id=NEW.student_id AND i.paid_minor+NEW.amount_minor<=i.total_minor)
BEGIN SELECT RAISE(ABORT,'Payment exceeds the remaining invoice balance'); END;

CREATE TRIGGER IF NOT EXISTS parent_link_membership_guard BEFORE INSERT ON parent_student_links
WHEN NOT EXISTS(SELECT 1 FROM school_memberships m WHERE m.school_id=NEW.school_id AND m.user_id=NEW.parent_user_id AND m.role='parent' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Parent must have an active parent membership in this school'); END;
CREATE TRIGGER IF NOT EXISTS student_account_membership_guard BEFORE INSERT ON student_account_links
WHEN NOT EXISTS(SELECT 1 FROM school_memberships m WHERE m.school_id=NEW.school_id AND m.user_id=NEW.user_id AND m.role='student' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'Student account must have an active student membership in this school'); END;
