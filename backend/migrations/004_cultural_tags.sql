-- Migration: Create cultural_tags and recipe_cultural_tags tables
-- Run this in the Supabase SQL Editor

-- 1. cultural_tags — curated flat taxonomy with optional region-scope
CREATE TABLE public.cultural_tags (
  id       serial PRIMARY KEY,
  key      text   NOT NULL UNIQUE,
  label_en text   NOT NULL,
  label_tr text   NOT NULL,
  country  text   NULL
);

-- 2. recipe_cultural_tags — junction (many-to-many)
CREATE TABLE public.recipe_cultural_tags (
  recipe_id uuid    NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  tag_id    integer NOT NULL REFERENCES public.cultural_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- 3. Seed: 10 curated tags (mirrors mobile mock taxonomy)
INSERT INTO public.cultural_tags (key, label_en, label_tr, country) VALUES
  ('social-gathering', 'Social Gathering',  'Sosyal Toplanma',  NULL),
  ('religious-feast',  'Religious Feast',   'Dini Kutlama',     NULL),
  ('wedding',          'Wedding',           'Düğün',            NULL),
  ('funeral',          'Funeral',           'Cenaze',           NULL),
  ('birth',            'Birth Celebration', 'Doğum Kutlaması',  NULL),
  ('new-year',         'New Year',          'Yeni Yıl',         NULL),
  ('harvest',          'Harvest Festival',  'Hasat Festivali',  NULL),
  ('sira-gecesi',      'Sıra Gecesi',       'Sıra Gecesi',      'Turkey'),
  ('iftar',            'Iftar',             'İftar',            'Turkey'),
  ('mochitsuki',       'Mochitsuki',        'Mochitsuki',       'Japan');

-- 4. Enable RLS
ALTER TABLE public.cultural_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_cultural_tags ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for cultural_tags (read-only for everyone)
CREATE POLICY "Anyone can read cultural_tags"
  ON public.cultural_tags FOR SELECT
  USING (true);

-- 6. RLS policies for recipe_cultural_tags
CREATE POLICY "Anyone can read recipe_cultural_tags"
  ON public.recipe_cultural_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert recipe_cultural_tags"
  ON public.recipe_cultural_tags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete recipe_cultural_tags"
  ON public.recipe_cultural_tags FOR DELETE
  USING (true);
