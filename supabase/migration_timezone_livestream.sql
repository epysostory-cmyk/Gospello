-- ============================================================
-- Add timezone and livestream_url to events table
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS timezone       TEXT NOT NULL DEFAULT 'Africa/Lagos',
  ADD COLUMN IF NOT EXISTS livestream_url TEXT;
