import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /dish-varieties ──────────────────────────────────────────────────────
// Returns all dish varieties. Optionally filtered by genreId and/or search.
// Query params: ?genreId=<number> ?search=<string>
router.get("/", async (req, res) => {
  const genreId = req.query["genreId"];
  const search = req.query["search"];

  let query = supabase
    .from("dish_varieties")
    .select(
      `id, name, description, genre_id,
       dish_genre:dish_genres!dish_varieties_genre_id_fkey(id, name)`
    )
    .order("name");

  if (genreId !== undefined) {
    const parsed = Number(genreId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return res
        .status(400)
        .json(errorResponse("VALIDATION_ERROR", "genreId must be a positive integer."));
    }
    query = query.eq("genre_id", parsed);
  }

  if (search !== undefined) {
    const trimmed = typeof search === "string" ? search.trim() : "";
    if (trimmed.length > 0) {
      query = query.ilike("name", `%${trimmed}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  return res.status(200).json(successResponse(data));
});

// ─── GET /dish-varieties/:id ──────────────────────────────────────────────────
// Returns a single dish variety with its published recipes.
router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);

  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json(errorResponse("VALIDATION_ERROR", "id must be a positive integer."));
  }

  const { data: variety, error: varietyError } = await supabase
    .from("dish_varieties")
    .select(
      `id, name, description, genre_id,
       dish_genre:dish_genres!dish_varieties_genre_id_fkey(id, name)`
    )
    .eq("id", id)
    .single();

  if (varietyError) {
    if (varietyError.code === "PGRST116") {
      return res
        .status(404)
        .json(errorResponse("NOT_FOUND", "Dish variety not found."));
    }
    return res.status(500).json(errorResponse("DB_ERROR", varietyError.message));
  }

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("id, title, type, average_rating, rating_count, country, city, district, created_at, updated_at")
    .eq("dish_variety_id", id)
    .eq("is_published", true)
    .order("average_rating", { ascending: false });

  if (recipesError) {
    return res.status(500).json(errorResponse("DB_ERROR", recipesError.message));
  }

  return res.status(200).json(successResponse({ ...variety, recipes }));
});

// ─── GET /dish-varieties/:id/recipes ─────────────────────────────────────────
// Returns published recipes for a dish variety, separated into:
//   - expertRecipe: the cultural recipe (type = "cultural"), or null
//   - communityRecipes: all community recipes sorted by rating descending
router.get("/:id/recipes", async (req, res) => {
  const id = Number(req.params["id"]);

  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json(errorResponse("VALIDATION_ERROR", "id must be a positive integer."));
  }

  const { error: varietyError } = await supabase
    .from("dish_varieties")
    .select("id")
    .eq("id", id)
    .single();

  if (varietyError) {
    if (varietyError.code === "PGRST116") {
      return res
        .status(404)
        .json(errorResponse("NOT_FOUND", "Dish variety not found."));
    }
    return res.status(500).json(errorResponse("DB_ERROR", varietyError.message));
  }

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select(
      `id, title, type, average_rating, rating_count, country, city, district, created_at, updated_at,
       creator:profiles!recipes_creator_id_fkey(id, username)`
    )
    .eq("dish_variety_id", id)
    .eq("is_published", true)
    .order("average_rating", { ascending: false });

  if (recipesError) {
    return res.status(500).json(errorResponse("DB_ERROR", recipesError.message));
  }

  const expertRecipe = recipes.find((r) => r.type === "cultural") ?? null;
  const communityRecipes = recipes.filter((r) => r.type === "community");

  return res.status(200).json(successResponse({ expertRecipe, communityRecipes }));
});

export default router;
