import { Translator, type TextResult } from "deepl-node";
import { supabase } from "../config/supabase.js";

// ─── Unit Translation Maps ────────────────────────────────────────────────────

const EN_TO_TR: Record<string, string> = {
  cup: "bardak",
  tbsp: "yemek kaşığı",
  tsp: "çay kaşığı",
  g: "g",
  kg: "kg",
  mg: "mg",
  ml: "ml",
  l: "litre",
  oz: "oz",
  lb: "lb",
  pinch: "tutam",
  piece: "adet",
  slice: "dilim",
  clove: "diş",
  bunch: "demet",
  handful: "avuç",
  drop: "damla",
  stick: "çubuk",
  sheet: "yaprak",
  can: "kutu",
  jar: "kavanoz",
  package: "paket",
  bag: "torba",
  bottle: "şişe",
  sprig: "dal",
  stalk: "sap",
  head: "baş",
  pod: "bakla",
  cube: "küp",
  strip: "şerit",
  fillet: "fileto",
  portion: "porsiyon",
  serving: "servis",
  dash: "az",
  splash: "çok az",
};

// Build TR→EN by inverting EN_TO_TR (skip identity entries like g, kg, etc.)
const TR_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_TR)
    .filter(([en, tr]) => en !== tr)
    .map(([en, tr]) => [tr, en])
);

/**
 * Translate a unit string using the hardcoded mapping.
 * Returns the mapped value, or the original if no mapping exists.
 */
function translateUnit(unit: string, targetLang: "EN" | "TR"): string {
  const map = targetLang === "TR" ? EN_TO_TR : TR_TO_EN;
  return map[unit.toLowerCase()] ?? unit;
}

// ─── Main Translation Function ────────────────────────────────────────────────

/**
 * Translates a published recipe's title, story, step descriptions, and
 * ingredient units to the opposite supported language (EN ↔ TR).
 *
 * - title / story / step descriptions: via DeepL
 * - ingredient units: via hardcoded mapping (no DeepL call)
 *
 * Intended to be called fire-and-forget after a recipe is published.
 * Errors are logged but never thrown to the caller.
 */
export async function translateRecipe(recipeId: string): Promise<void> {
  const apiKey = process.env["DEEPL_API_KEY"];
  if (!apiKey) {
    console.error("[translation] DEEPL_API_KEY is not set — skipping translation.");
    return;
  }

  const translator = new Translator(apiKey);

  // 1. Fetch recipe fields, steps, and ingredients in parallel
  const [recipeResult, stepsResult, ingredientsResult] = await Promise.all([
    supabase.from("recipes").select("title, story").eq("id", recipeId).single(),
    supabase
      .from("recipe_steps")
      .select("id, description")
      .eq("recipe_id", recipeId)
      .order("step_order", { ascending: true }),
    supabase
      .from("recipe_ingredients")
      .select("id, unit")
      .eq("recipe_id", recipeId),
  ]);

  if (recipeResult.error || !recipeResult.data) {
    console.error(`[translation] Could not fetch recipe ${recipeId}:`, recipeResult.error);
    return;
  }

  const recipe = recipeResult.data;
  const steps = stepsResult.data ?? [];
  const ingredients = ingredientsResult.data ?? [];

  // 2. Detect source language by translating title to EN-US
  let detectedSource: string;
  let enTitle: string;

  try {
    const result = (await translator.translateText(recipe.title, null, "en-US")) as TextResult;
    detectedSource = result.detectedSourceLang; // e.g. 'en', 'tr'
    enTitle = result.text;
  } catch (err) {
    console.error(`[translation] DeepL detection failed for recipe ${recipeId}:`, err);
    return;
  }

  const sourceIsEnglish = detectedSource === "en";
  const langCode: "EN" | "TR" = sourceIsEnglish ? "TR" : "EN";

  // 3. Translate title, story, step descriptions via DeepL
  let translatedTitle: string;
  let translatedStory: string | null = null;
  let translatedStepDescriptions: string[] = [];

  const extraTexts: string[] = [];
  if (recipe.story) extraTexts.push(recipe.story as string);
  for (const step of steps) extraTexts.push(step.description);

  try {
    if (sourceIsEnglish) {
      const allTexts = [recipe.title, ...extraTexts];
      const results = (await translator.translateText(allTexts, null, "tr")) as TextResult[];
      translatedTitle = results[0]!.text;
      let idx = 1;
      if (recipe.story) translatedStory = results[idx++]!.text;
      translatedStepDescriptions = results.slice(idx).map((r) => r.text);
    } else {
      translatedTitle = enTitle;
      if (extraTexts.length > 0) {
        const results = (await translator.translateText(extraTexts, null, "en-US")) as TextResult[];
        let idx = 0;
        if (recipe.story) translatedStory = results[idx++]!.text;
        translatedStepDescriptions = results.slice(idx).map((r) => r.text);
      }
    }
  } catch (err) {
    console.error(`[translation] DeepL translation failed for recipe ${recipeId}:`, err);
    return;
  }

  // 4. Upsert recipe translation
  const { error: recipeTransError } = await supabase
    .from("recipe_translations")
    .upsert(
      { recipe_id: recipeId, language_code: langCode, title: translatedTitle, story: translatedStory },
      { onConflict: "recipe_id,language_code" }
    );

  if (recipeTransError) {
    console.error(`[translation] Failed to store recipe translation (${langCode}):`, recipeTransError);
  }

  // 5. Upsert step translations
  if (steps.length > 0) {
    const stepRows = steps.map((step, i) => ({
      step_id: step.id,
      language_code: langCode,
      description: translatedStepDescriptions[i] ?? step.description,
    }));

    const { error: stepsTransError } = await supabase
      .from("recipe_step_translations")
      .upsert(stepRows, { onConflict: "step_id,language_code" });

    if (stepsTransError) {
      console.error(`[translation] Failed to store step translations (${langCode}):`, stepsTransError);
    }
  }

  // 6. Upsert ingredient unit translations via hardcoded mapping
  if (ingredients.length > 0) {
    const ingredientRows = ingredients.map((ing) => ({
      recipe_ingredient_id: ing.id,
      language_code: langCode,
      unit: translateUnit(ing.unit, langCode),
    }));

    const { error: ingTransError } = await supabase
      .from("recipe_ingredient_translations")
      .upsert(ingredientRows, { onConflict: "recipe_ingredient_id,language_code" });

    if (ingTransError) {
      console.error(`[translation] Failed to store ingredient translations (${langCode}):`, ingTransError);
    }
  }

  console.log(`[translation] Recipe ${recipeId} translated to ${langCode}.`);
}
