import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { validate } from "../middleware/validate.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const discoveryQuerySchema = z.object({
  region: z.string().optional(),
  // Comma-separated allergen IDs to exclude (e.g. "1,2,3")
  excludeAllergens: z.string().optional(),
  genreId: z.coerce.number().int().positive().optional(),
  varietyId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── GET /discovery/recipes ───────────────────────────────────────────────────
// Returns published recipes with composable filters:
//   ?region=Turkey
//   ?excludeAllergens=1,2,3   (allergen IDs)
//   ?genreId=1
//   ?varietyId=1
//   ?page=1&limit=20
router.get(
  "/recipes",
  validate(discoveryQuerySchema, "query"),
  async (req, res) => {
    const { region, excludeAllergens, genreId, varietyId, page, limit } =
      req.query as z.infer<typeof discoveryQuerySchema>;

    // ── Step 1: Resolve variety IDs to exclude based on allergens ─────────────
    let excludedRecipeIds: number[] = [];

    if (excludeAllergens) {
      const allergenIds = excludeAllergens
        .split(",")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0);

      if (allergenIds.length > 0) {
        // Find ingredient IDs that carry any of the excluded allergens
        const { data: allergenIngredientRows, error: allergenErr } =
          await supabase
            .from("ingredient_allergens")
            .select("ingredient_id")
            .in("allergen_id", allergenIds);

        if (allergenErr) {
          return res
            .status(500)
            .json(errorResponse("DB_ERROR", allergenErr.message));
        }

        const excludedIngredientIds = [
          ...new Set(allergenIngredientRows?.map((r) => r.ingredient_id) ?? []),
        ];

        if (excludedIngredientIds.length > 0) {
          // Find recipe IDs that use those ingredients
          const { data: recipeIngredientRows, error: riErr } = await supabase
            .from("recipe_ingredients")
            .select("recipe_id")
            .in("ingredient_id", excludedIngredientIds);

          if (riErr) {
            return res
              .status(500)
              .json(errorResponse("DB_ERROR", riErr.message));
          }

          excludedRecipeIds = [
            ...new Set(
              recipeIngredientRows?.map((r) => r.recipe_id) ?? []
            ),
          ];
        }
      }
    }

    // ── Step 2: Resolve variety IDs when filtering by genre ───────────────────
    let varietyIdsForGenre: number[] | null = null;

    if (genreId !== undefined) {
      const { data: varietyRows, error: genreErr } = await supabase
        .from("dish_varieties")
        .select("id")
        .eq("genre_id", genreId);

      if (genreErr) {
        return res
          .status(500)
          .json(errorResponse("DB_ERROR", genreErr.message));
      }

      varietyIdsForGenre = varietyRows?.map((v) => v.id) ?? [];

      // No varieties in this genre → return empty result immediately
      if (varietyIdsForGenre.length === 0) {
        return res.status(200).json(
          successResponse({
            recipes: [],
            pagination: { page, limit, total: 0 },
          })
        );
      }
    }

    // ── Step 3: Build the main recipe query ───────────────────────────────────
    let query = supabase
      .from("recipes")
      .select(
        `id, title, type, region, average_rating, rating_count,
         created_at, updated_at,
         dish_variety:dish_varieties!recipes_dish_variety_id_fkey(
           id, name,
           dish_genre:dish_genres!dish_varieties_genre_id_fkey(id, name)
         ),
         profile:profiles!recipes_profile_id_fkey(id, username)`,
        { count: "exact" }
      )
      .eq("is_published", true);

    if (region) {
      query = query.eq("region", region);
    }

    if (varietyId !== undefined) {
      query = query.eq("dish_variety_id", varietyId);
    } else if (varietyIdsForGenre !== null) {
      query = query.in("dish_variety_id", varietyIdsForGenre);
    }

    if (excludedRecipeIds.length > 0) {
      query = query.not("id", "in", `(${excludedRecipeIds.join(",")})`);
    }

    // ── Step 4: Pagination ────────────────────────────────────────────────────
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order("average_rating", { ascending: false });

    const { data: recipes, error: recipesError, count } = await query;

    if (recipesError) {
      return res
        .status(500)
        .json(errorResponse("DB_ERROR", recipesError.message));
    }

    return res.status(200).json(
      successResponse({
        recipes,
        pagination: {
          page,
          limit,
          total: count ?? 0,
        },
      })
    );
  }
);

export default router;
