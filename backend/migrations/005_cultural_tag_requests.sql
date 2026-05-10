-- Migration: Create cultural_tag_requests table
-- Run this in the Supabase SQL Editor

CREATE TABLE public.cultural_tag_requests (
  id            serial      PRIMARY KEY,
  requested_by  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label_en      text        NULL,
  label_tr      text        NULL,
  country       text        NULL,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_note text        NULL,
  decided_by    uuid        NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  decided_at    timestamptz NULL
);

CREATE INDEX cultural_tag_requests_status_created_at_idx
  ON public.cultural_tag_requests (status, created_at DESC);

CREATE INDEX cultural_tag_requests_requested_by_idx
  ON public.cultural_tag_requests (requested_by);

ALTER TABLE public.cultural_tag_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cultural_tag_requests"
  ON public.cultural_tag_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cultural_tag_requests"
  ON public.cultural_tag_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cultural_tag_requests"
  ON public.cultural_tag_requests FOR UPDATE
  USING (true);
