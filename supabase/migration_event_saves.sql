-- event_saves table (mirrors saved_events for new SaveButton flow)
-- The app currently uses 'saved_events'; this table is created for completeness
-- and the server actions point to saved_events for backwards compatibility.
CREATE TABLE IF NOT EXISTS public.event_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Add payment_status to attendances table
ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'not_applicable';

-- RLS for event_saves
ALTER TABLE public.event_saves ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'event_saves' AND policyname = 'Users can manage their own saves'
  ) THEN
    CREATE POLICY "Users can manage their own saves"
      ON public.event_saves FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'event_saves' AND policyname = 'Anyone can read saves count'
  ) THEN
    CREATE POLICY "Anyone can read saves count"
      ON public.event_saves FOR SELECT USING (true);
  END IF;
END$$;
