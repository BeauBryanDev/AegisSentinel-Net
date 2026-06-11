-- AegisSentinel-Net — 002_create_recordings.sql
-- Recordings table: one row per live stream session.
-- Must run before detections (FK dependency).

CREATE TYPE recording_status_enum AS ENUM ('active', 'completed', 'error');
 
CREATE TABLE IF NOT EXISTS recordings (
    id          SERIAL PRIMARY KEY,
 
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    camera_id   VARCHAR(64),
    status      recording_status_enum NOT NULL DEFAULT 'active',
 
    started_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings (user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status  ON recordings (status);
 

 