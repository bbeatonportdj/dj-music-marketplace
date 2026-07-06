-- Migration: Add gdrive_file_id to tracks table
-- This allows storing Google Drive file IDs for streaming downloads

ALTER TABLE tracks ADD COLUMN IF NOT EXISTS gdrive_file_id TEXT;

-- Optional: Create index for faster lookups by gdrive_file_id
CREATE INDEX IF NOT EXISTS idx_tracks_gdrive_file_id ON tracks (gdrive_file_id);
