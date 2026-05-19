-- Event series table for recurring events
CREATE TABLE IF NOT EXISTS event_series (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  recurrence_rule JSONB NOT NULL,
  organizer_id      UUID REFERENCES profiles(id)           ON DELETE SET NULL,
  church_id         UUID REFERENCES churches(id)           ON DELETE SET NULL,
  seeded_organizer_id UUID REFERENCES seeded_organizers(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Link events to their series
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_series_id UUID REFERENCES event_series(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_series_id ON events(event_series_id);

-- RLS: anyone can read series
ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_series_select_all"
  ON event_series FOR SELECT
  USING (true);

CREATE POLICY "event_series_insert_owner"
  ON event_series FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "event_series_update_owner"
  ON event_series FOR UPDATE
  USING (auth.uid() = organizer_id);
