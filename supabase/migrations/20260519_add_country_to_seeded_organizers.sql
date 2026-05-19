-- Add country column to seeded_organizers (was missing from initial schema)
ALTER TABLE seeded_organizers ADD COLUMN IF NOT EXISTS country text DEFAULT 'Nigeria';
