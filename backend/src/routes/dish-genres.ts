import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { parseLangParam, resolveLang } from "../utils/i18n.js";

const router = Router();

// ─── GET /dish-genres ─────────────────────────────────────────────────────────
// Returns all dish genres with their nested varieties.
// Query params:
//   lang — "en" or "tr"; when provided returns a single resolved `name` /
//           `description` field instead of the full _en / _tr pair

router.get("/", async (req, res) => {
  const lang = parseLangParam(req.query["lang"]);
  if (lang === "invalid") {
    return res.status(400).json(errorResponse("VALIDATION_ERROR", "lang must be 'en' or 'tr'."));
  }

  const { data: genres, error: genreError } = await supabase
    .from("dish_genres")
    .select("id, name, name_en, name_tr, description, description_en, description_tr")
    .order("name");

  if (genreError) {
    return res.status(500).json(errorResponse("DB_ERROR", genreError.message));
  }

  const { data: varieties, error: varietyError } = await supabase
    .from("dish_varieties")
    .select("id, name, name_en, name_tr, genre_id")
    .order("name");

  if (varietyError) {
    return res.status(500).json(errorResponse("DB_ERROR", varietyError.message));
  }

  if (lang) {
    const resolvedVarieties = (varieties as any[]).map((v) => ({
      id: v.id,
      genre_id: v.genre_id,
      name: resolveLang(v.name_en, v.name_tr, lang) ?? v.name,
    }));

    const result = (genres as any[]).map((genre) => ({
      id: genre.id,
      name: resolveLang(genre.name_en, genre.name_tr, lang) ?? genre.name,
      description: resolveLang(genre.description_en, genre.description_tr, lang) ?? genre.description,
      varieties: resolvedVarieties.filter((v) => v.genre_id === genre.id),
    }));

    return res.status(200).json(successResponse(result));
  }

  // Without lang: return all fields including _en / _tr
  const result = (genres as any[]).map((genre) => ({
    ...genre,
    varieties: (varieties as any[]).filter((v) => v.genre_id === genre.id),
  }));

  return res.status(200).json(successResponse(result));
});

export default router;
