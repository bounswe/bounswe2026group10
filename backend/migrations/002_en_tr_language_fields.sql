-- Migration: Add EN/TR language fields to translatable reference tables
-- Issue #412 — Update data models and migration for en/tr language fields

-- ─── ingredients ─────────────────────────────────────────────────────────────
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_tr text;

-- Seed English names from existing data
UPDATE ingredients SET name_en = name WHERE name_en IS NULL;

-- ─── dietary_tags ─────────────────────────────────────────────────────────────
ALTER TABLE dietary_tags
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_tr text;

UPDATE dietary_tags SET name_en = name WHERE name_en IS NULL;

-- ─── dish_genres ─────────────────────────────────────────────────────────────
ALTER TABLE dish_genres
  ADD COLUMN IF NOT EXISTS name_en        text,
  ADD COLUMN IF NOT EXISTS name_tr        text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_tr text;

UPDATE dish_genres SET name_en = name WHERE name_en IS NULL;
UPDATE dish_genres
  SET description_en = description
  WHERE description_en IS NULL AND description IS NOT NULL;

-- ─── dish_varieties ───────────────────────────────────────────────────────────
ALTER TABLE dish_varieties
  ADD COLUMN IF NOT EXISTS name_en        text,
  ADD COLUMN IF NOT EXISTS name_tr        text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_tr text;

UPDATE dish_varieties SET name_en = name WHERE name_en IS NULL;
UPDATE dish_varieties
  SET description_en = description
  WHERE description_en IS NULL AND description IS NOT NULL;
