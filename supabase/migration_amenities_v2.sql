-- Migration: Extended event amenities
-- Run this in your Supabase SQL editor

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS shuttle_available      boolean  DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS wheelchair_accessible  boolean  DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS food_provided          boolean  DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS accommodation_available boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS dress_code             text,
  ADD COLUMN IF NOT EXISTS no_recording           boolean  DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS gender_restriction     text;

-- gender_restriction values: NULL (no restriction), 'women_only', 'men_only'
-- dress_code: NULL (no dress code), or a description like 'Smart casual' / 'All-white'
