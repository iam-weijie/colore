-- Migration: Add shorthand_emojis column to users table
-- Run this SQL script in your Neon database console

-- Check if column already exists (optional - for verification)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'shorthand_emojis';

-- Add the shorthand_emojis column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'shorthand_emojis'
    ) THEN
        ALTER TABLE users ADD COLUMN shorthand_emojis JSONB DEFAULT NULL;
        RAISE NOTICE 'Column shorthand_emojis added successfully';
    ELSE
        RAISE NOTICE 'Column shorthand_emojis already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'shorthand_emojis';
