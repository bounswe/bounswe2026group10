-- Migration 008: recipe_tool_translations
-- Stores DeepL-generated translations of recipe tool names (EN↔TR).
-- Follows the same pattern as recipe_step_translations.

CREATE TABLE public.recipe_tool_translations (
  recipe_tool_id integer NOT NULL
    REFERENCES public.recipe_tools(id) ON DELETE CASCADE,
  language_code  text    NOT NULL CHECK (language_code IN ('EN', 'TR')),
  name           text    NOT NULL,
  PRIMARY KEY (recipe_tool_id, language_code)
);

CREATE INDEX recipe_tool_translations_tool_id_idx
  ON public.recipe_tool_translations (recipe_tool_id);
