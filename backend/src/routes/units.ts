import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /units ───────────────────────────────────────────────────────────────
// Search units by partial name match (case-insensitive).
// Query params:
//   search — partial unit name (optional)
// Returns distinct unit values from recipe_ingredients.

router.get("/", async (req, res) => {
  const search = (req.query["search"] as string | undefined)?.trim();

  let query = supabase.from("recipe_ingredients").select("unit");

  if (search) {
    query = query.ilike("unit", `%${search}%`);
  }

  const { data, error } = await query.order("unit");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  const seen = new Set<string>();
  const unique = (data ?? []).filter((row) => {
    if (seen.has(row.unit)) return false;
    seen.add(row.unit);
    return true;
  });

  return res.status(200).json(successResponse(unique));
});

export default router;
