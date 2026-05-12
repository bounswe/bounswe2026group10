-- Migration 009: localize allergens + units in recipe detail
-- Adds the EN/TR `name_en` / `name_tr` columns the API now expects on
-- allergens and introduces a `units` reference table that mirrors the
-- ingredients pattern (id, name, name_en, name_tr) so the `/recipes/:id`
-- endpoint can resolve a recipe-ingredient's free-text unit to the caller's
-- preferred language.

-- ─── allergens ────────────────────────────────────────────────────────────────
ALTER TABLE public.allergens
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_tr text;

UPDATE public.allergens
  SET name_en = name
  WHERE name_en IS NULL;

-- ─── units ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.units (
  id         serial      PRIMARY KEY,
  name       text        NOT NULL UNIQUE,
  name_en    text,
  name_tr    text,
  created_at timestamptz DEFAULT now()
);

-- Lower-case lookup index: recipe_ingredients.unit is free text, so the API
-- joins on a case-insensitive match against units.name.
CREATE INDEX IF NOT EXISTS units_name_lower_idx
  ON public.units (LOWER(name));

-- Read is public; nothing in the app writes to this table at runtime.
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'units' AND policyname = 'Anyone can read units'
  ) THEN
    CREATE POLICY "Anyone can read units"
      ON public.units FOR SELECT
      USING (true);
  END IF;
END $$;

-- Seed the units we already see in recipe_ingredients today plus the common
-- TR-locale variants. ON CONFLICT keeps re-runs safe.
INSERT INTO public.units (name, name_en, name_tr) VALUES
  ('g',           'g',           'g'),
  ('gr',          'g',           'gr'),
  ('gram',        'gram',        'gram'),
  ('grams',       'grams',       'gram'),
  ('kg',          'kg',          'kg'),
  ('kilogram',    'kilogram',    'kilogram'),
  ('mg',          'mg',          'mg'),
  ('ml',          'ml',          'ml'),
  ('milliliter',  'milliliter',  'mililitre'),
  ('l',           'L',           'L'),
  ('liter',       'liter',       'litre'),
  ('cup',         'cup',         'su bardağı'),
  ('cups',        'cups',        'su bardağı'),
  ('tbsp',        'tbsp',        'yemek kaşığı'),
  ('tablespoon',  'tablespoon',  'yemek kaşığı'),
  ('tablespoons', 'tablespoons', 'yemek kaşığı'),
  ('tsp',         'tsp',         'tatlı kaşığı'),
  ('teaspoon',    'teaspoon',    'tatlı kaşığı'),
  ('teaspoons',   'teaspoons',   'tatlı kaşığı'),
  ('pinch',       'pinch',       'tutam'),
  ('pinches',     'pinches',     'tutam'),
  ('dash',        'dash',        'tutam'),
  ('piece',       'piece',       'adet'),
  ('pieces',      'pieces',      'adet'),
  ('slice',       'slice',       'dilim'),
  ('slices',      'slices',      'dilim'),
  ('clove',       'clove',       'diş'),
  ('cloves',      'cloves',      'diş'),
  ('bunch',       'bunch',       'demet'),
  ('handful',     'handful',     'avuç'),
  ('drop',        'drop',        'damla'),
  ('drops',       'drops',       'damla'),
  ('oz',          'oz',          'ons'),
  ('ounce',       'ounce',       'ons'),
  ('lb',          'lb',          'libre'),
  ('pound',       'pound',       'libre'),
  -- TR-authored units mapped back to EN
  ('su bardağı',     'cup',                 'su bardağı'),
  ('çay bardağı',    'tea glass',           'çay bardağı'),
  ('yemek kaşığı',   'tablespoon',          'yemek kaşığı'),
  ('tatlı kaşığı',   'dessert spoon',       'tatlı kaşığı'),
  ('çay kaşığı',     'teaspoon',            'çay kaşığı'),
  ('tutam',          'pinch',               'tutam'),
  ('adet',           'piece',               'adet'),
  ('dilim',          'slice',               'dilim'),
  ('diş',            'clove',               'diş'),
  ('demet',          'bunch',               'demet'),
  ('avuç',           'handful',             'avuç'),
  ('damla',          'drop',                'damla'),
  ('paket',          'pack',                'paket'),
  ('kutu',           'box',                 'kutu')
ON CONFLICT (name) DO NOTHING;
