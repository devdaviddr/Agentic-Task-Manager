-- Migration: Add Firebase Authentication Support
-- Description: Adds firebase_uid column and modifies existing schema for Firebase auth

-- Add Firebase UID column (nullable initially for safety)
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Make password_hash nullable (for rollback safety during migration)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Note: After successful migration and testing, you can optionally drop:
-- DROP TABLE IF EXISTS invalidated_tokens;
-- DROP TABLE IF EXISTS refresh_tokens;
-- ALTER TABLE users DROP COLUMN IF EXISTS password_hash;