-- Migration: Add admin role + expert approval workflow
-- Adds:
--   1. 'admin' as a valid value in profiles.role
--   2. Partial unique index ensuring at most one admin can exist
--   3. expert_requests table for the expert-account approval workflow
--
-- The matching rollback lives in 003_admin_role_and_expert_requests_rollback.sql.

BEGIN;

-- ─── 1. profiles.role: allow 'admin' ──────────────────────────────────────────
-- Drop whichever role-check constraint currently exists (name varies across
-- environments) and recreate it with 'admin' included.
DO $$
DECLARE
  cons RECORD;
BEGIN
  FOR cons IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype  = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cons.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('learner', 'cook', 'expert', 'admin'));

-- ─── 2. Single-admin invariant ────────────────────────────────────────────────
-- Partial unique index: enforce that at most one row may have role='admin'.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_one_admin_only
  ON public.profiles ((role))
  WHERE role = 'admin';

-- ─── 3. expert_requests table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expert_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason        text        NULL,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_note text        NULL,
  decided_by    uuid        NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  decided_at    timestamptz NULL
);

-- One pending request per user (a user with a pending request may not open another)
CREATE UNIQUE INDEX IF NOT EXISTS expert_requests_one_pending_per_user
  ON public.expert_requests (user_id)
  WHERE status = 'pending';

-- Helpful indexes
CREATE INDEX IF NOT EXISTS expert_requests_status_created_at_idx
  ON public.expert_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS expert_requests_user_id_idx
  ON public.expert_requests (user_id);

COMMIT;
