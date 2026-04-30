-- ============================================================
-- Fix: make organizer_id nullable for admin-seeded events
-- Run in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop the NOT NULL constraint FIRST (must come before the backfill UPDATE)
ALTER TABLE public.events
  ALTER COLUMN organizer_id DROP NOT NULL;

-- Step 2: Backfill — clear organizer_id on existing admin-created seed events
-- (events that belong to a seeded organizer or church, not a real auth organizer)
UPDATE public.events
SET organizer_id = NULL
WHERE created_by_admin = true
  AND (seeded_organizer_id IS NOT NULL OR church_id IS NOT NULL);

-- Step 3: Update RLS select policy to handle NULL organizer_id safely
-- NULL organizer_id means it's an admin-seeded event — treat it like a public event
DROP POLICY IF EXISTS "Approved events are viewable by everyone" ON public.events;
CREATE POLICY "Approved events are viewable by everyone"
  ON public.events FOR SELECT USING (
    status = 'approved'
    OR (organizer_id IS NOT NULL AND auth.uid() = organizer_id)
  );
