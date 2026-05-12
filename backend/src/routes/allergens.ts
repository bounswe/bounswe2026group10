import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { validate } from "../middleware/validate.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { parseLangParam, resolveLang } from "../utils/i18n.js";

const router = Router();

// ─── GET /allergens ───────────────────────────────────────────────────────────
// Query params:
//   lang — "en" or "tr"; when provided returns a single resolved `name` field
//           instead of the full name_en / name_tr pair

router.get("/", async (req, res) => {
  const lang = parseLangParam(req.query["lang"]);
  if (lang === "invalid") {
    return res.status(400).json(errorResponse("VALIDATION_ERROR", "lang must be 'en' or 'tr'."));
  }

  const { data, error } = await supabase
    .from("allergens")
    .select("id, name, name_en, name_tr")
    .order("name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  if (lang) {
    return res.status(200).json(successResponse(
      (data as any[]).map((row) => ({
        id: row.id,
        name: resolveLang(row.name_en, row.name_tr, lang) ?? row.name,
      }))
    ));
  }

  return res.status(200).json(successResponse(data));
});

// ─── POST /allergens/detect ───────────────────────────────────────────────────

const detectSchema = z.object({
  ingredientIds: z.array(z.number().int().positive()).min(1, {
    message: "At least one ingredient ID is required.",
  }),
});

router.post("/detect", validate(detectSchema), async (req, res) => {
  const { ingredientIds } = req.body as z.infer<typeof detectSchema>;

  const { data, error } = await supabase
    .from("ingredient_allergens")
    .select("allergen:allergens(id, name)")
    .in("ingredient_id", ingredientIds);

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  const seen = new Set<number>();
  const allergens = (data ?? [])
    .map((row: any) => row.allergen)
    .filter((a: any) => a && !seen.has(a.id) && seen.add(a.id));

  return res.status(200).json(successResponse(allergens));
});

export default router;
