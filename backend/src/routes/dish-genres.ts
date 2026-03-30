import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /dish-genres ─────────────────────────────────────────────────────────
// Returns all dish genres with their nested varieties.
router.get("/", async (_req, res) => {
  const { data: genres, error: genreError } = await supabase
    .from("dish_genres")
    .select("id, name, description")
    .order("name");

  if (genreError) {
    return res.status(500).json(errorResponse("DB_ERROR", genreError.message));
  }

  const { data: varieties, error: varietyError } = await supabase
    .from("dish_varieties")
    .select("id, name, genre_id")
    .order("name");

  if (varietyError) {
    return res.status(500).json(errorResponse("DB_ERROR", varietyError.message));
  }

  // Nest varieties under their parent genre
  const result = genres.map((genre) => ({
    ...genre,
    varieties: varieties.filter((v) => v.genre_id === genre.id),
  }));

  return res.status(200).json(successResponse(result));
});

export default router;
