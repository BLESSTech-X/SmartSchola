ALTER TABLE school_settings ADD COLUMN sms_provider TEXT NOT NULL DEFAULT 'africas_talking';
ALTER TABLE school_settings ADD COLUMN sms_sender_id TEXT NOT NULL DEFAULT 'SmartSchola';
CREATE TABLE IF NOT EXISTS sms_messages (
 id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
 recipient_name TEXT NOT NULL DEFAULT '', recipient_phone TEXT NOT NULL, message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','sent','delivered','failed')),
 provider_reference TEXT, error_message TEXT, sent_by TEXT NOT NULL REFERENCES users(id),
 sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS sms_messages_school_date_idx ON sms_messages(school_id,sent_at DESC);
