-- AegisSentinel-Net — 003_create_detections.sql
-- Detections table: one row per inference event.
-- Weapons data lives here as JSONB (no separate weapons table
-- for incident data — design decision for single-record incidents).


CREATE TYPE detection_type_enum AS ENUM ('violence', 'weapon', 'contact', 'normal');
CREATE TYPE alert_level_enum    AS ENUM ('low', 'medium', 'high', 'critical');
 
CREATE TABLE IF NOT EXISTS detections (
    id                  SERIAL PRIMARY KEY,
 
    recording_id        INTEGER REFERENCES recordings(id) ON DELETE SET NULL,
    user_id             INTEGER REFERENCES users(id)      ON DELETE SET NULL,
 
    detection_type      detection_type_enum NOT NULL,
    alert_level         alert_level_enum    NOT NULL DEFAULT 'low',
 
    -- Violence model output
    violence_confidence DOUBLE PRECISION,
    violence_triggered  BOOLEAN NOT NULL DEFAULT FALSE,
    attention_weights   JSONB,
 
    -- Weapon model output (JSONB, no separate table)
    weapons_data        JSONB,
    weapon_detected     BOOLEAN NOT NULL DEFAULT FALSE,
 
    -- Pose model output
    pose_data           JSONB,
    persons_count       INTEGER,
    contact_iou         DOUBLE PRECISION,
 
    -- Frame context
    camera_id           VARCHAR(64),
    frame_timestamp     TIMESTAMP,
    snapshot_path       VARCHAR(512),
 
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_detections_recording_id   ON detections (recording_id);
CREATE INDEX IF NOT EXISTS idx_detections_user_id        ON detections (user_id);
--CREATE INDEX IF NOT EXISTS idx_detections_type           ON detections (detection_type);
CREATE INDEX IF NOT EXISTS idx_detections_camera_id      ON detections (camera_id);
CREATE INDEX IF NOT EXISTS idx_detections_created_at     ON detections (created_at);
 
-- Composite index for the dashboard main query:
-- "latest high alerts with weapons"
CREATE INDEX IF NOT EXISTS idx_detections_dashboard
    ON detections (alert_level, weapon_detected, created_at DESC);
 
-- JSONB GIN index for weapon queries:
-- WHERE weapons_data->'gun'->>'detected' = 'true'
--CREATE INDEX IF NOT EXISTS idx_detections_weapons_gin
 --   ON detections USING GIN (weapons_data);
 -- Note: GIN index on JSONB can be large and may not be necessary if we only query a few keys.
 