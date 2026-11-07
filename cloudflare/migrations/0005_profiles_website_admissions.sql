ALTER TABLE users ADD COLUMN avatar_data TEXT;
ALTER TABLE schools ADD COLUMN logo_data TEXT;

CREATE TABLE IF NOT EXISTS school_website_content (
  school_id TEXT PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
  content_json TEXT NOT NULL DEFAULT '{}',
  is_published INTEGER NOT NULL DEFAULT 0 CHECK(is_published IN (0,1)),
  updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS admissions_applications (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  application_number TEXT NOT NULL,
  learner_name TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  grade_applied TEXT NOT NULL,
  previous_school TEXT,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','under_review','accepted','waitlisted','rejected','enrolled')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,application_number)
);
CREATE INDEX IF NOT EXISTS admissions_school_status_idx ON admissions_applications(school_id,status,created_at DESC);
