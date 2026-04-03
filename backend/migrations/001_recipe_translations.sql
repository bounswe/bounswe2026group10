-- Migration: Recipe Translation Tables
-- Issue #193 — Automated Recipe Translation on Publish

-- Stores translated title and story for a recipe in a given language.
CREATE TABLE IF NOT EXISTS recipe_translations (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id     uuid        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  language_code text        NOT NULL,
  title         text        NOT NULL,
  story         text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (recipe_id, language_code)
);

-- Stores translated description for a recipe step in a given language.
CREATE TABLE IF NOT EXISTS recipe_step_translations (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id       int4        NOT NULL REFERENCES recipe_steps(id) ON DELETE CASCADE,
  language_code text        NOT NULL,
  description   text        NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (step_id, language_code)
);

-- Stores translated unit for a recipe ingredient in a given language.
CREATE TABLE IF NOT EXISTS recipe_ingredient_translations (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_ingredient_id  int4        NOT NULL REFERENCES recipe_ingredients(id) ON DELETE CASCADE,
  language_code         text        NOT NULL,
  unit                  text        NOT NULL,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (recipe_ingredient_id, language_code)
);
