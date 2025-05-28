-- Migration: Add nickname column to users table
-- Run this SQL script in your Neon database console

-- Check if column already exists (optional - for verification)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'nickname';

-- Add the nickname column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'nickname'
    ) THEN
        ALTER TABLE users ADD COLUMN nickname VARCHAR(255) DEFAULT NULL;
        RAISE NOTICE 'Column nickname added successfully';
    ELSE
        RAISE NOTICE 'Column nickname already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'nickname';
