-- Migration: Create dish_variety_requests table
-- Run this in the Supabase SQL Editor

CREATE TABLE public.dish_variety_requests (
  id             serial      PRIMARY KEY,
  requested_by   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  genre_id       integer     NOT NULL REFERENCES public.dish_genres(id) ON DELETE CASCADE,
  name_en        text        NULL,
  name_tr        text        NULL,
  description_en text        NULL,
  description_tr text        NULL,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_note  text        NULL,
  decided_by     uuid        NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  decided_at     timestamptz NULL
);
CREATE INDEX dish_variety_requests_status_idx ON public.dish_variety_requests (status, created_at DESC);
CREATE INDEX dish_variety_requests_requested_by_idx ON public.dish_variety_requests (requested_by);
ALTER TABLE public.dish_variety_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read dish_variety_requests" ON public.dish_variety_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert dish_variety_requests" ON public.dish_variety_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update dish_variety_requests" ON public.dish_variety_requests FOR UPDATE USING (true);
