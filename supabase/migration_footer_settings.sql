-- ============================================================
-- Gospello Footer & Site Settings Migration
-- Run in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
-- ============================================================

-- ── 1. Ensure site_settings table exists ────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 2. Denomination column on churches (if not already added) ─
ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS denomination TEXT;

-- ── 3. ministry_type column on profiles ─────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ministry_type TEXT;

-- ── 4. Default footer settings ──────────────────────────────
-- Upsert default values only when they don't exist yet
INSERT INTO public.site_settings (key, value)
VALUES
  ('footer_tagline', '"Nigeria''s home for Christian events — worship nights, conferences, prayer gatherings and more, across all 36 states and beyond."'),
  ('footer_columns', '[{"heading":"Explore","links":[{"label":"Events","url":"/events"},{"label":"Categories","url":"/categories"},{"label":"Churches","url":"/churches"},{"label":"Organizers","url":"/organizers"}]},{"heading":"Company","links":[{"label":"About Us","url":"/about"},{"label":"Contact Us","url":"/contact"},{"label":"Privacy Policy","url":"/privacy"},{"label":"Terms of Use","url":"/terms"}]}]'),
  ('footer_social', '{"instagram":"","twitter":"","facebook":"","youtube":"","tiktok":"","whatsapp":""}'),
  ('footer_copyright', '"© {year} Gospello. All rights reserved."'),
  ('footer_contact_email', '"hello@gospello.com"'),
  ('footer_bottom_links', '[{"label":"Privacy Policy","url":"/privacy"},{"label":"Terms of Use","url":"/terms"}]'),
  ('homepage_church_cta', '{"heading":"Is your church on Gospello?","subtext":"Join churches and organizers reaching more believers by listing your events for free.","button1_label":"Register Your Church","button1_url":"/auth/signup?type=church","button2_label":"Post an Event","button2_url":"/auth/signup","visible":true}'),
  ('privacy_policy_content', 'null'),
  ('terms_content', 'null')
ON CONFLICT (key) DO NOTHING;
