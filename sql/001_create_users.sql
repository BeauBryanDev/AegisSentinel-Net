-- AegisSentinel-Net — 001_create_users.sql
-- Users table. Executed automatically by Docker on first boot
-- via /docker-entrypoint-initdb.d (alphabetical order).

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
 
    name            VARCHAR(100)  NOT NULL,
    username        VARCHAR(50)   NOT NULL UNIQUE,
    gender          VARCHAR(20),
    email           VARCHAR(255)  NOT NULL UNIQUE,
    phone_number    VARCHAR(30),
    city            VARCHAR(100),
    country         VARCHAR(100),
    address         VARCHAR(255),
 
    hashed_password VARCHAR(255)  NOT NULL,
 
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    is_admin        BOOLEAN       NOT NULL DEFAULT FALSE,
 
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);

