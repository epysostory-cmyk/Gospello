-- ============================================================
-- Gospello Phase 2 Migration
-- Run in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
-- ============================================================

-- ── 1. Profiles table additions ─────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role          VARCHAR(20)  DEFAULT 'user' NOT NULL,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS state         TEXT,
  ADD COLUMN IF NOT EXISTS church_name   TEXT,
  ADD COLUMN IF NOT EXISTS bio           TEXT,
  ADD COLUMN IF NOT EXISTS website       TEXT,
  ADD COLUMN IF NOT EXISTS status        VARCHAR(20)  DEFAULT 'active' NOT NULL,
  ADD COLUMN IF NOT EXISTS is_hidden     BOOLEAN      DEFAULT false NOT NULL;

-- ── 2. Churches table: make profile_id nullable ──────────────
-- Allow admin-seeded churches with no profile owner
ALTER TABLE public.churches
  ALTER COLUMN profile_id DROP NOT NULL;

-- ── 3. Churches table additions ─────────────────────────────
ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS owner_user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_claimed         BOOLEAN     DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS created_by_admin   BOOLEAN     DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS source             VARCHAR(50) DEFAULT 'self_signup',
  ADD COLUMN IF NOT EXISTS source_url         TEXT,
  ADD COLUMN IF NOT EXISTS claim_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claim_requested_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claim_verified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_badge     BOOLEAN     DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_hidden          BOOLEAN     DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS denomination       TEXT,
  ADD COLUMN IF NOT EXISTS pastor_name        TEXT,
  ADD COLUMN IF NOT EXISTS instagram          TEXT,
  ADD COLUMN IF NOT EXISTS facebook           TEXT;

-- Update church owner policy to also check owner_user_id
CREATE POLICY "Church owners can update by owner_id"
  ON public.churches FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- Admins can manage all churches (service role bypasses RLS but this enables row-level checks)
CREATE POLICY "Admins can manage churches"
  ON public.churches FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 4. seeded_organizers table (must come before events FK) ─
CREATE TABLE IF NOT EXISTS public.seeded_organizers (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT        NOT NULL,
  slug            TEXT        UNIQUE NOT NULL,
  description     TEXT,
  contact_person  TEXT,
  ministry_type   TEXT,
  city            TEXT        NOT NULL DEFAULT 'Lagos',
  state           TEXT        NOT NULL DEFAULT 'Lagos',
  address         TEXT,
  phone           TEXT,
  website         TEXT,
  instagram       TEXT,
  facebook        TEXT,
  logo_url        TEXT,
  source          VARCHAR(50) DEFAULT 'admin_seed',
  source_url      TEXT,
  owner_user_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_claimed      BOOLEAN     DEFAULT false NOT NULL,
  is_verified     BOOLEAN     DEFAULT false NOT NULL,
  verified_badge  BOOLEAN     DEFAULT false NOT NULL,
  created_by_admin BOOLEAN    DEFAULT true NOT NULL,
  claim_requested_at  TIMESTAMPTZ,
  claim_requested_by  UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_verified_at   TIMESTAMPTZ,
  is_hidden       BOOLEAN     DEFAULT false NOT NULL,
  is_featured     BOOLEAN     DEFAULT false NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.seeded_organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seeded organizers are publicly viewable"
  ON public.seeded_organizers FOR SELECT USING (true);

CREATE TRIGGER handle_seeded_organizers_updated_at
  BEFORE UPDATE ON public.seeded_organizers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ── 6. Events table: add seeded_organizer link ──────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seeded_organizer_id UUID REFERENCES public.seeded_organizers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_admin    BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS source_url          TEXT;

-- ── 7. claim_requests table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.claim_requests (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_type      TEXT        NOT NULL CHECK (profile_type IN ('church', 'organizer')),
  profile_id        UUID        NOT NULL,
  profile_name      TEXT        NOT NULL,
  claimant_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimant_name     TEXT        NOT NULL,
  claimant_email    TEXT        NOT NULL,
  claimant_role     TEXT        NOT NULL,
  claimant_phone    TEXT        NOT NULL,
  verification_notes TEXT       NOT NULL,
  document_url      TEXT,
  status            TEXT        DEFAULT 'pending' NOT NULL CHECK (status IN ('pending','approved','rejected')),
  reviewed_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claim requests"
  ON public.claim_requests FOR SELECT
  USING (auth.uid() = claimant_id);

CREATE POLICY "Users can submit claim requests"
  ON public.claim_requests FOR INSERT
  WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Admins can view all claim requests"
  ON public.claim_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update claim requests"
  ON public.claim_requests FOR UPDATE
  USING (public.is_admin());

-- ── 8. Performance indexes ───────────────────────────────────
CREATE INDEX IF NOT EXISTS churches_is_claimed_idx   ON public.churches(is_claimed);
CREATE INDEX IF NOT EXISTS churches_is_hidden_idx    ON public.churches(is_hidden);
CREATE INDEX IF NOT EXISTS seeded_orgs_slug_idx      ON public.seeded_organizers(slug);
CREATE INDEX IF NOT EXISTS seeded_orgs_state_idx     ON public.seeded_organizers(state);
CREATE INDEX IF NOT EXISTS claim_requests_status_idx ON public.claim_requests(status);
CREATE INDEX IF NOT EXISTS claim_requests_profile_idx ON public.claim_requests(profile_id, profile_type);
