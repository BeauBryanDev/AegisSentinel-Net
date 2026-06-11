-- AegisSentinel-Net — 004_create_events.sql
-- Events table: high-level incidents derived from detections.


CREATE TYPE event_type_enum     AS ENUM ('fight', 'weapon', 'contact', 'system');
CREATE TYPE event_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
 
CREATE TABLE IF NOT EXISTS events (
    id           SERIAL PRIMARY KEY,
 
    recording_id INTEGER REFERENCES recordings(id) ON DELETE SET NULL,
    detection_id INTEGER REFERENCES detections(id) ON DELETE SET NULL,
    user_id      INTEGER REFERENCES users(id)      ON DELETE SET NULL,
 
    event_type   event_type_enum     NOT NULL,
    severity     event_severity_enum NOT NULL DEFAULT 'medium',
    description  TEXT,
    camera_id    VARCHAR(64),
 
    started_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at     TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_events_recording_id ON events (recording_id);
CREATE INDEX IF NOT EXISTS idx_events_detection_id ON events (detection_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id      ON events (user_id);
CREATE INDEX IF NOT EXISTS idx_events_type         ON events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_started_at   ON events (start

