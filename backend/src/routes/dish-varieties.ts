import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { parseLangParam, resolveLang } from "../utils/i18n.js";

const router = Router();

// ─── GET /dish-varieties ──────────────────────────────────────────────────────
// Returns all dish varieties. Optionally filtered by genreId and/or search.
// Query params:
//   genreId — filter by genre (positive integer, optional)
//   search  — partial name match (optional)
//   lang    — "en" or "tr"; when provided returns resolved name/description
//             instead of the full _en / _tr pair
router.get("/", async (req, res) => {
  const genreId = req.query["genreId"];
  const search = req.query["search"];
  const lang = parseLangParam(req.query["lang"]);

  if (lang === "invalid") {
    return res
      .status(400)
      .json(errorResponse("VALIDATION_ERROR", "lang must be 'en' or 'tr'."));
  }

  let query = supabase
    .from("dish_varieties")
    .select(
      `id, name, name_en, name_tr, description, description_en, description_tr, genre_id,
       dish_genre:dish_genres!dish_varieties_genre_id_fkey(id, name, name_en, name_tr)`
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

  if (lang) {
    return res.status(200).json(successResponse(
      (data as any[]).map((v) => ({
        id: v.id,
        genre_id: v.genre_id,
        name: resolveLang(v.name_en, v.name_tr, lang) ?? v.name,
        description: resolveLang(v.description_en, v.description_tr, lang) ?? v.description,
        dish_genre: v.dish_genre
          ? {
              id: v.dish_genre.id,
              name: resolveLang(v.dish_genre.name_en, v.dish_genre.name_tr, lang) ?? v.dish_genre.name,
            }
          : null,
      }))
    ));
  }

  return res.status(200).json(successResponse(data));
});

// ─── GET /dish-varieties/:id ──────────────────────────────────────────────────
// Returns a single dish variety with its published recipes.
// Query params:
//   lang — "en" or "tr" (optional)
router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const lang = parseLangParam(req.query["lang"]);

  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json(errorResponse("VALIDATION_ERROR", "id must be a positive integer."));
  }
  if (lang === "invalid") {
    return res
      .status(400)
      .json(errorResponse("VALIDATION_ERROR", "lang must be 'en' or 'tr'."));
  }

  const { data: variety, error: varietyError } = await supabase
    .from("dish_varieties")
    .select(
      `id, name, name_en, name_tr, description, description_en, description_tr, genre_id,
       dish_genre:dish_genres!dish_varieties_genre_id_fkey(id, name, name_en, name_tr)`
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

  if (lang) {
    const v = variety as any;
    return res.status(200).json(successResponse({
      id: v.id,
      genre_id: v.genre_id,
      name: resolveLang(v.name_en, v.name_tr, lang) ?? v.name,
      description: resolveLang(v.description_en, v.description_tr, lang) ?? v.description,
      dish_genre: v.dish_genre
        ? {
            id: v.dish_genre.id,
            name: resolveLang(v.dish_genre.name_en, v.dish_genre.name_tr, lang) ?? v.dish_genre.name,
          }
        : null,
      recipes,
    }));
  }

  return res.status(200).json(successResponse({ ...(variety as any), recipes }));
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
