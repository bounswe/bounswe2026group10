-- Rollback for 003_admin_role_and_expert_requests.sql
--
-- WARNING: this drops the expert_requests table (all data lost) and the
-- single-admin index, then narrows profiles.role back to the legacy three
-- roles. If any profile already has role='admin' the role-check recreation
-- step below will fail; promote/demote that profile first.

BEGIN;

-- ─── 3. Drop expert_requests ──────────────────────────────────────────────────
DROP INDEX IF EXISTS public.expert_requests_user_id_idx;
DROP INDEX IF EXISTS public.expert_requests_status_created_at_idx;
DROP INDEX IF EXISTS public.expert_requests_one_pending_per_user;
DROP TABLE  IF EXISTS public.expert_requests;

-- ─── 2. Drop single-admin index ───────────────────────────────────────────────
DROP INDEX IF EXISTS public.profiles_one_admin_only;

-- ─── 1. profiles.role: revert to legacy three-role check ──────────────────────
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
  CHECK (role IN ('learner', 'cook', 'expert'));

COMMIT;
