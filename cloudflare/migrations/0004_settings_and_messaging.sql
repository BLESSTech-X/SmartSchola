-- SMS settings and message log.
-- The remote database already contains both settings columns and the sms_messages
-- table from an earlier partial/manual application. Keep this migration safely
-- re-runnable for that existing state; column additions are handled only when
-- needed by the dedicated schema reconciliation, not repeated here.
CREATE TABLE IF NOT EXISTS sms_messages (
 id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
 recipient_name TEXT NOT NULL DEFAULT '', recipient_phone TEXT NOT NULL, message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','sent','delivered','failed')),
 provider_reference TEXT, error_message TEXT, sent_by TEXT NOT NULL REFERENCES users(id),
 sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS sms_messages_school_date_idx ON sms_messages(school_id,sent_at DESC);
