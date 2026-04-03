import { genAI, GEMINI_MODEL } from "../config/gemini.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface ParsedStep {
  stepOrder: number;
  description: string;
}

export interface ParsedTool {
  name: string;
}

export interface ParsedRecipe {
  title: string;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  tools: ParsedTool[];
}

export interface StandardizedIngredient {
  name: string;
  originalQuantity: number;
  originalUnit: string;
  standardQuantity: number;
  standardUnit: string;
}

export interface StandardizedStep {
  stepOrder: number;
  originalDescription: string;
  standardDescription: string;
}

export interface StandardizeResult {
  ingredients: StandardizedIngredient[];
  steps: StandardizedStep[];
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a recipe parsing assistant. Your job is to extract structured recipe data from free-text recipe narratives.

Given a free-text recipe, extract the following and return ONLY valid JSON (no markdown fences, no commentary):

{
  "title": "A short descriptive title for the recipe",
  "ingredients": [
    { "name": "ingredient name (lowercase)", "quantity": <number>, "unit": "unit of measurement" }
  ],
  "steps": [
    { "stepOrder": <number starting from 1>, "description": "clear instruction for this step" }
  ],
  "tools": [
    { "name": "tool or equipment name (lowercase)" }
  ]
}

Rules:
- Extract ALL ingredients mentioned with their quantities and units.
- If a quantity is not specified, use 1 as default.
- If a unit is not specified, use "piece" as default.
- Convert written numbers to numeric values (e.g. "two" → 2).
- Extract ALL cooking tools and equipment mentioned (oven, pan, bowl, whisk, etc.).
- Break the recipe into clear, ordered steps.
- Each step should be a single, actionable instruction.
- The title should be concise and descriptive.
- Return ONLY the JSON object, nothing else.`;

const UNIT_STANDARDIZATION_PROMPT = `You are a culinary standardization assistant. Your job is to:
1. Convert informal/colloquial ingredient measurements into standard units.
2. Rewrite informal/colloquial step descriptions into clear, universally understood instructions.

Given JSON arrays of ingredients and steps, plus an optional region hint, standardize both. Return ONLY valid JSON (no markdown fences, no commentary):

{
  "ingredients": [
    {
      "name": "ingredient name",
      "originalQuantity": <original number>,
      "originalUnit": "original unit as provided",
      "standardQuantity": <converted number>,
      "standardUnit": "standard unit"
    }
  ],
  "steps": [
    {
      "stepOrder": <number>,
      "originalDescription": "original step text",
      "standardDescription": "rewritten step with clear, standard terms"
    }
  ]
}

Standard units to use for ingredients (pick the most appropriate):
- Weight: "g", "kg"
- Volume: "ml", "L"
- Count: "piece", "slice", "clove", "sprig"
- Spoons: "tsp" (5 ml), "tbsp" (15 ml)

Ingredient rules:
- Convert ALL informal/colloquial units to standard ones. Examples:
  - "a pinch" → 1 g or 0.5 g depending on ingredient
  - "a handful" → approximate grams for that ingredient
  - "1 tea glass" (Turkish "çay bardağı") → 100 ml
  - "1 water glass" (Turkish "su bardağı") → 200 ml
  - "1 cup" → 240 ml
  - "1 dash" → 0.5 ml
  - "to taste" → keep as "to taste" (cannot be standardized)
- If the unit is ALREADY standard (g, kg, ml, L, tsp, tbsp, piece), keep it as-is.
- Use the region hint to resolve ambiguous terms (e.g., "cup" differs between US/UK/metric).
- Be accurate — consider the ingredient's density when converting volume to weight or vice versa.
- Round standardQuantity to at most 1 decimal place.

Step rules:
- Replace colloquial/traditional cooking expressions with clear, standard descriptions. Examples:
  - "kulak memesi kıvamı" (Turkish: earlobe consistency) → "knead until the dough is soft and smooth, similar to the texture of an earlobe (not sticky, slightly firm)"
  - "göz kararı ekleyin" (Turkish: add by eye) → "add approximately to your preference"
  - "parmak testi yapın" (Turkish: do the finger test) → "press the surface lightly with your finger; if it springs back, it is ready"
  - "ağda kıvamına gelene kadar" (Turkish: until it reaches waxing consistency) → "cook until the mixture thickens and forms a thick, sticky syrup that stretches between fingers"
  - "altın rengi olana kadar" → "cook until golden brown"
- Keep the meaning and intent of the original step — just make it universally understandable.
- If a step is already clear and standard, keep it as-is in standardDescription.
- The standardDescription should be in the same language as the original unless the original is in a non-English language, in which case translate to English.

Return ONLY the JSON object, nothing else.`;

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parses a free-text recipe narrative into structured components using Gemini AI.
 *
 * @param freeText - The free-text recipe narrative to parse.
 * @returns Parsed recipe with title, ingredients, steps, and tools.
 * @throws Error if the AI response cannot be parsed or the API call fails.
 */
export async function parseRecipeText(freeText: string): Promise<ParsedRecipe> {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `\n\nRecipe text:\n${freeText}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 200)}`);
  }

  // Validate and normalize the parsed output
  if (!parsed.title || typeof parsed.title !== "string") {
    parsed.title = "Untitled Recipe";
  }

  const ingredients: ParsedIngredient[] = (parsed.ingredients ?? []).map((i: any) => ({
    name: String(i.name ?? "unknown").toLowerCase(),
    quantity: Number(i.quantity) || 1,
    unit: String(i.unit ?? "piece"),
  }));

  const steps: ParsedStep[] = (parsed.steps ?? [])
    .map((s: any, idx: number) => {
      // Gemini may return alternate keys like text/instruction/step.
      if (typeof s === "string") {
        const plain = s.trim();
        if (!plain) return null;
        return {
          stepOrder: idx + 1,
          description: plain,
        };
      }

      const description = String(
        s?.description ?? s?.text ?? s?.instruction ?? s?.step ?? ""
      ).trim();

      if (!description) return null;

      return {
        stepOrder: Number(s?.stepOrder) || idx + 1,
        description,
      };
    })
    .filter((s: ParsedStep | null): s is ParsedStep => s !== null);

  const tools: ParsedTool[] = (parsed.tools ?? []).map((t: any) => ({
    name: String(t.name ?? "").toLowerCase(),
  }));

  return {
    title: parsed.title,
    ingredients,
    steps,
    tools,
  };
}

// ─── Standardizer ───────────────────────────────────────────────────────────

/**
 * Converts informal/colloquial ingredient units and step descriptions
 * to standard measurements and clear instructions using Gemini AI,
 * with optional region awareness.
 *
 * @param ingredients - Array of ingredients with name, quantity, unit.
 * @param steps - Optional array of steps with stepOrder and description.
 * @param region - Optional region hint (e.g. "Turkey", "Mexico") for locale-aware conversion.
 * @returns Ingredients and steps with both original and standardized values.
 */
export async function standardizeUnits(
  ingredients: ParsedIngredient[],
  steps?: ParsedStep[],
  region?: string
): Promise<StandardizeResult> {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const parts: string[] = [];
  if (region) parts.push(`Region: ${region}`);
  parts.push(`Ingredients:\n${JSON.stringify(ingredients)}`);
  if (steps && steps.length > 0) {
    parts.push(`Steps:\n${JSON.stringify(steps)}`);
  }

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: UNIT_STANDARDIZATION_PROMPT },
          { text: `\n\n${parts.join("\n\n")}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();

  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 200)}`);
  }

  const standardizedIngredients: StandardizedIngredient[] = (parsed.ingredients ?? []).map((i: any) => ({
    name: String(i.name ?? "unknown").toLowerCase(),
    originalQuantity: Number(i.originalQuantity) || 1,
    originalUnit: String(i.originalUnit ?? "piece"),
    standardQuantity: Number(i.standardQuantity) || 1,
    standardUnit: String(i.standardUnit ?? "piece"),
  }));

  const standardizedSteps: StandardizedStep[] = (parsed.steps ?? []).map((s: any, idx: number) => ({
    stepOrder: Number(s.stepOrder) || idx + 1,
    originalDescription: String(s.originalDescription ?? ""),
    standardDescription: String(s.standardDescription ?? s.originalDescription ?? ""),
  }));

  return {
    ingredients: standardizedIngredients,
    steps: standardizedSteps,
  };
}
