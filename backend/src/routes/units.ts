import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { buildSearchVariants, turkishFold } from "../utils/text.js";
import { escapeLikePattern } from "../utils/locations.js";

const router = Router();

// ─── GET /units ───────────────────────────────────────────────────────────────
// Search units by partial name match (case-insensitive, Turkish-aware).
// Query params:
//   search — partial unit name (optional)
// Returns distinct unit values from recipe_ingredients.

router.get("/", async (req, res) => {
  const search = (req.query["search"] as string | undefined)?.trim();

  let query = supabase.from("recipe_ingredients").select("unit");

  // Expand the input into Turkish/diacritic-tolerant variants so searches
  // like "bardak" still match rows stored as "çay bardağı" (#402).
  if (search) {
    const variants = buildSearchVariants(search);
    if (variants.length > 0) {
      const orFilter = variants
        .map((v) => `unit.ilike.%${escapeLikePattern(v)}%`)
        .join(",");
      query = query.or(orFilter);
    }
  }

  const { data, error } = await query.order("unit");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  // Dedupe by Turkish-fold so "Çay Bardağı" and "çay bardağı" collapse.
  const seen = new Set<string>();
  const unique = (data ?? []).filter((row) => {
    const key = turkishFold(row.unit ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return res.status(200).json(successResponse(unique));
});

export default router;
