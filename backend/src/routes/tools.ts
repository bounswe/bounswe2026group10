import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { buildSearchVariants, turkishFold } from "../utils/text.js";
import { escapeLikePattern } from "../utils/locations.js";

const router = Router();

// ─── GET /tools ──────────────────────────────────────────────────────────────
// Search tools by partial name match (case-insensitive, Turkish-aware).
// Query params:
//   search — partial tool name (optional)
// Returns distinct tool names from recipe_tools.

router.get("/", async (req, res) => {
  const search = (req.query["search"] as string | undefined)?.trim();

  let query = supabase.from("recipe_tools").select("name");

  // Expand the input into Turkish/diacritic-tolerant variants so searches
  // like "kasik" still match rows stored as "Kaşık" (#402).
  if (search) {
    const variants = buildSearchVariants(search);
    if (variants.length > 0) {
      const orFilter = variants
        .map((v) => `name.ilike.%${escapeLikePattern(v)}%`)
        .join(",");
      query = query.or(orFilter);
    }
  }

  const { data, error } = await query.order("name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  // Dedupe by Turkish-fold so "Kaşık" and "kaşık" collapse into one entry.
  const seen = new Set<string>();
  const unique = (data ?? []).filter((tool) => {
    const key = turkishFold(tool.name ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return res.status(200).json(successResponse(unique));
});

export default router;
