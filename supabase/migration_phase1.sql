-- ============================================================
-- Gospello Phase 1 Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add new columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS views_count    integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS speakers       text,
  ADD COLUMN IF NOT EXISTS parking_available boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS child_friendly    boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

-- 2. Create attendances table
CREATE TABLE IF NOT EXISTS public.attendances (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (event_id, email)
);

ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Anyone can register (insert)
CREATE POLICY "Anyone can register attendance"
  ON public.attendances FOR INSERT
  WITH CHECK (true);

-- Users can view their own attendance records
CREATE POLICY "Users can view own attendances"
  ON public.attendances FOR SELECT
  USING (auth.uid() = user_id);

-- Organizers can view attendances for their own events
CREATE POLICY "Organizers can view event attendances"
  ON public.attendances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = attendances.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all attendances"
  ON public.attendances FOR SELECT
  USING (public.is_admin());

-- Admins can delete
CREATE POLICY "Admins can delete attendances"
  ON public.attendances FOR DELETE
  USING (public.is_admin());

-- 3. Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id    uuid NOT NULL,
  target_type  text NOT NULL CHECK (target_type IN ('church', 'organizer')),
  created_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE (follower_id, target_id, target_type)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own follows"
  ON public.follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Follows are publicly viewable"
  ON public.follows FOR SELECT
  USING (true);

-- 4. Function to safely increment event views (bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_event_views(p_event_id uuid)
RETURNS void AS $$
  UPDATE public.events
  SET views_count = views_count + 1
  WHERE id = p_event_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS attendances_event_id_idx ON public.attendances(event_id);
CREATE INDEX IF NOT EXISTS attendances_user_id_idx  ON public.attendances(user_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx     ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_target_idx       ON public.follows(target_id);
CREATE INDEX IF NOT EXISTS events_featured_until_idx ON public.events(featured_until)
  WHERE featured_until IS NOT NULL;
