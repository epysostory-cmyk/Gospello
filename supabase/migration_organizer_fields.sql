-- ============================================================
-- Organizer profile fields expansion
-- Run in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
-- ============================================================

-- ── 1. profiles table additions ─────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS address        TEXT,
  ADD COLUMN IF NOT EXISTS phone          TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp       TEXT,
  ADD COLUMN IF NOT EXISTS instagram      TEXT,
  ADD COLUMN IF NOT EXISTS facebook       TEXT,
  ADD COLUMN IF NOT EXISTS twitter        TEXT,
  ADD COLUMN IF NOT EXISTS youtube        TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS ministry_types TEXT[];

-- ── 2. seeded_organizers table additions ─────────────────────
ALTER TABLE public.seeded_organizers
  ADD COLUMN IF NOT EXISTS whatsapp       TEXT,
  ADD COLUMN IF NOT EXISTS twitter        TEXT,
  ADD COLUMN IF NOT EXISTS youtube        TEXT,
  ADD COLUMN IF NOT EXISTS ministry_types TEXT[];
