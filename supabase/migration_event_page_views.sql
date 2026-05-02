-- Anonymous page view tracking for events
-- Stores one row per session per event — no PII, session_id is a random UUID from localStorage

CREATE TABLE IF NOT EXISTS event_page_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_id  text NOT NULL,
  referral    text,                   -- 'wa' | 'tg' | 'x' | 'copy' | null (direct)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_page_views_event_id_idx ON event_page_views(event_id);
CREATE INDEX IF NOT EXISTS event_page_views_created_at_idx ON event_page_views(created_at);

-- Unique: one row per session per event (deduplicated views)
CREATE UNIQUE INDEX IF NOT EXISTS event_page_views_session_event_idx ON event_page_views(event_id, session_id);

ALTER TABLE event_page_views ENABLE ROW LEVEL SECURITY;

-- No public read — only admin/service role can query
CREATE POLICY "service role only" ON event_page_views
  USING (false);
