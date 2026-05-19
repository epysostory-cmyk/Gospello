-- Allow events to be published without a confirmed time (anticipation/teaser posts)
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_tba boolean NOT NULL DEFAULT false;
