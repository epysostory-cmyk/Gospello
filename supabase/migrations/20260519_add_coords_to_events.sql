-- Add geocoordinates to events for distance-based Near Me sorting
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS latitude  double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;
