-- Public staff and learner recruitment, plus school-to-teacher notifications.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teacher_application_details (
  membership_id TEXT PRIMARY KEY REFERENCES school_memberships(id) ON DELETE CASCADE,
  phone TEXT NOT NULL DEFAULT '',
  qualifications TEXT NOT NULL DEFAULT '',
  subjects TEXT NOT NULL DEFAULT '',
  years_experience INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS student_enrollment_requests (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT '',
  date_of_birth TEXT,
  gender TEXT CHECK(gender IS NULL OR gender IN ('Male','Female','Other')),
  guardian_name TEXT NOT NULL DEFAULT '',
  guardian_phone TEXT NOT NULL DEFAULT '',
  previous_school TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(school_id,user_id),
  FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS student_enrollment_school_status_idx
  ON student_enrollment_requests(school_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS student_enrollment_class_status_idx
  ON student_enrollment_requests(school_id,class_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS school_notifications (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS school_notifications_recipient_idx
  ON school_notifications(school_id,recipient_user_id,created_at DESC);
