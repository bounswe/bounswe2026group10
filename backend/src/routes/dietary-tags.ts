import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { parseLangParam, resolveLang } from "../utils/i18n.js";

const router = Router();

// ─── GET /dietary-tags ───────────────────────────────────────────────────────
// Returns all supported dietary and allergen tags.
// Query params:
//   lang — "en" or "tr"; when provided returns a single resolved `name` field
//           instead of the full name_en / name_tr pair

router.get("/", async (req, res) => {
  const lang = parseLangParam(req.query["lang"]);
  if (lang === "invalid") {
    return res.status(400).json(errorResponse("VALIDATION_ERROR", "lang must be 'en' or 'tr'."));
  }

  const { data, error } = await supabase
    .from("dietary_tags")
    .select("id, name, name_en, name_tr, category")
    .order("category")
    .order("name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  if (lang) {
    return res.status(200).json(successResponse(
      (data as any[]).map((row) => ({
        id: row.id,
        name: resolveLang(row.name_en, row.name_tr, lang) ?? row.name,
        category: row.category,
      }))
    ));
  }

  return res.status(200).json(successResponse(data));
});

export default router;
