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

  const steps: ParsedStep[] = (parsed.steps ?? []).map((s: any, idx: number) => ({
    stepOrder: Number(s.stepOrder) || idx + 1,
    description: String(s.description ?? ""),
  }));

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
