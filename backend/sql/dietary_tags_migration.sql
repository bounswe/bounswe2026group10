-- Migration: Create dietary_tags and recipe_dietary_tags tables
-- Run this in the Supabase SQL Editor

-- 1. Create the dietary_tags table
CREATE TABLE public.dietary_tags (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('dietary', 'allergen'))
);

-- 2. Create the recipe_dietary_tags junction table
CREATE TABLE public.recipe_dietary_tags (
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  tag_id integer NOT NULL REFERENCES public.dietary_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- 3. Seed supported tags
INSERT INTO public.dietary_tags (name, category) VALUES
  ('Halal', 'dietary'),
  ('Kosher', 'dietary'),
  ('Vegan', 'dietary'),
  ('Vegetarian', 'dietary'),
  ('Pescatarian', 'dietary'),
  ('Gluten-Free', 'allergen'),
  ('Dairy-Free', 'allergen'),
  ('Nut-Free', 'allergen'),
  ('Egg-Free', 'allergen'),
  ('Soy-Free', 'allergen'),
  ('Shellfish-Free', 'allergen');

-- 4. Enable RLS (Row Level Security) on both tables
ALTER TABLE public.dietary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_dietary_tags ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for dietary_tags (read-only for everyone)
CREATE POLICY "Anyone can read dietary_tags"
  ON public.dietary_tags FOR SELECT
  USING (true);

-- 6. RLS policies for recipe_dietary_tags
CREATE POLICY "Anyone can read recipe_dietary_tags"
  ON public.recipe_dietary_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert recipe_dietary_tags"
  ON public.recipe_dietary_tags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete recipe_dietary_tags"
  ON public.recipe_dietary_tags FOR DELETE
  USING (true);
