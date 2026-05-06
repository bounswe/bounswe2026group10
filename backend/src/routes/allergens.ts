import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { validate } from "../middleware/validate.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /allergens ───────────────────────────────────────────────────────────

router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("allergens")
    .select("id, name")
    .order("name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
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
