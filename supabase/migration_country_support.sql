-- Add country support to seeded_organizers
ALTER TABLE seeded_organizers
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'Nigeria';

-- Backfill any existing rows
UPDATE seeded_organizers SET country = 'Nigeria' WHERE country IS NULL;
