PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 180),
  slug TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','suspended')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS schools_status_idx ON schools(status);

CREATE TABLE IF NOT EXISTS school_memberships (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('headmaster','admin','teacher','student','parent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended')),
  login_identifier TEXT,
  granted_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,user_id),
  UNIQUE(school_id,login_identifier),
  UNIQUE(id,school_id)
);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON school_memberships(user_id,status);
CREATE INDEX IF NOT EXISTS memberships_school_role_idx ON school_memberships(school_id,role,status);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id,expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  identity_key TEXT NOT NULL COLLATE NOCASE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  is_blocked INTEGER NOT NULL DEFAULT 0 CHECK(is_blocked IN (0,1)),
  last_ip TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,identity_key)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  identity_key TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_on TEXT,
  ends_on TEXT,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK(is_current IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,name),
  CHECK(starts_on IS NULL OR ends_on IS NULL OR starts_on <= ends_on)
);
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_one_current_per_school ON academic_years(school_id) WHERE is_current=1;
CREATE INDEX IF NOT EXISTS academic_years_school_dates_idx ON academic_years(school_id,starts_on DESC);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_year_id TEXT,
  class_teacher_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(id,school_id),
  UNIQUE(school_id,name,academic_year_id),
  FOREIGN KEY(academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS classes_school_idx ON classes(school_id,name);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  membership_id TEXT,
  student_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT '',
  class_name TEXT NOT NULL DEFAULT '',
  class_id TEXT,
  date_of_birth TEXT,
  gender TEXT CHECK(gender IS NULL OR gender IN ('Male','Female','Other')),
  parent_phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','transferred','graduated')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,student_number),
  UNIQUE(id,school_id),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE RESTRICT,
  FOREIGN KEY(membership_id,school_id) REFERENCES school_memberships(id,school_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS students_membership_unique ON students(membership_id) WHERE membership_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS students_school_class_idx ON students(school_id,class_id);
CREATE INDEX IF NOT EXISTS students_school_name_idx ON students(school_id,last_name,first_name);
CREATE INDEX IF NOT EXISTS students_school_status_idx ON students(school_id,status);

CREATE TABLE IF NOT EXISTS class_teachers (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  membership_id TEXT NOT NULL,
  assigned_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,class_id,membership_id),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE CASCADE,
  FOREIGN KEY(membership_id,school_id) REFERENCES school_memberships(id,school_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS class_teachers_membership_idx ON class_teachers(school_id,membership_id);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  academic_year_id TEXT,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 160),
  subject TEXT NOT NULL CHECK(length(trim(subject)) BETWEEN 1 AND 100),
  assessment_type TEXT NOT NULL DEFAULT 'class_test' CHECK(assessment_type IN ('class_test','homework','quiz','mid_term','end_term','project','practical','other')),
  term TEXT,
  assessment_date TEXT,
  max_score REAL NOT NULL CHECK(max_score>0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  instructions TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(id,school_id),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE CASCADE,
  FOREIGN KEY(academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS assessments_school_class_date_idx ON assessments(school_id,class_id,assessment_date DESC);

CREATE TABLE IF NOT EXISTS assessment_scores (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  score REAL,
  remarks TEXT NOT NULL DEFAULT '',
  entered_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(assessment_id,student_id),
  FOREIGN KEY(assessment_id,school_id) REFERENCES assessments(id,school_id) ON DELETE CASCADE,
  FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE CASCADE,
  CHECK(score IS NULL OR score>=0)
);
CREATE INDEX IF NOT EXISTS scores_school_assessment_idx ON assessment_scores(school_id,assessment_id);

CREATE TABLE IF NOT EXISTS student_guardians (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  guardian_membership_id TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'parent' CHECK(relationship IN ('mother','father','guardian','grandparent','other')),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0,1)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','revoked')),
  linked_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,student_id,guardian_membership_id),
  FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE CASCADE,
  FOREIGN KEY(guardian_membership_id,school_id) REFERENCES school_memberships(id,school_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS student_account_links (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,student_id),
  UNIQUE(school_id,user_id),
  FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS parent_student_links (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  parent_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent' CHECK(length(trim(relationship)) BETWEEN 2 AND 40),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','revoked')),
  linked_by TEXT REFERENCES users(id),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,student_id,parent_user_id),
  FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS parent_student_links_parent_idx ON parent_student_links(school_id,parent_user_id,status);

CREATE TABLE IF NOT EXISTS platform_admins (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('owner','admin','support')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK((role='owner' AND created_by IS NULL) OR role<>'owner')
);
CREATE INDEX IF NOT EXISTS platform_admins_role_status_idx ON platform_admins(role,status);

CREATE TABLE IF NOT EXISTS platform_admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS platform_audit_created_idx ON platform_admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_actor_idx ON platform_admin_audit_logs(actor_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
