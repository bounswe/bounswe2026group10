import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /cultural-tags ──────────────────────────────────────────────────────
// Returns curated cultural-event tags.
// Query params:
//   country — when provided, returns only global tags (country IS NULL) plus
//              tags scoped to that country. Omitting the param returns all tags.
//
// Response shape mirrors the mobile mock client:
//   { id, key, labelEn, labelTr, country }

router.get("/", async (req, res) => {
  const country = typeof req.query["country"] === "string"
    ? req.query["country"].trim()
    : null;

  let query = supabase
    .from("cultural_tags")
    .select("id, key, label_en, label_tr, country")
    .order("country", { nullsFirst: true })
    .order("key");

  if (country) {
    query = query.or(`country.is.null,country.eq.${country}`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  const tags = (data as any[]).map((row) => ({
    id:      row.id,
    key:     row.key,
    labelEn: row.label_en,
    labelTr: row.label_tr,
    country: row.country ?? null,
  }));

  return res.status(200).json(successResponse(tags));
});

export default router;
