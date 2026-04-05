import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const discoveryQuerySchema = z.object({
  // Comma-separated allergen IDs to exclude (e.g. "1,2,3")
  excludeAllergens: z.string().optional(),
  // Comma-separated dietary tag IDs to require (e.g. "1,3" for Halal + Vegan)
  tagIds: z.string().optional(),
  genreId: z.coerce.number().int().positive().optional(),
  varietyId: z.coerce.number().int().positive().optional(),
  // Case-insensitive partial match on recipe title (e.g. "pasta")
  search: z.string().trim().optional(),
  // Location filters on recipe (e.g. "Turkey", "Adana", "Seyhan")
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── GET /discovery/recipes ───────────────────────────────────────────────────
// Returns published recipes with composable filters:
//   ?excludeAllergens=1,2,3   (allergen IDs)
//   ?genreId=1
//   ?varietyId=1
//   ?search=pasta             (case-insensitive partial title match)
//   ?country=Turkey&city=Adana&district=Seyhan
//   ?page=1&limit=20
router.get("/recipes", async (req, res) => {
    const parsed = discoveryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return res.status(400).json(errorResponse("VALIDATION_ERROR", message));
    }
    const { excludeAllergens, tagIds, genreId, varietyId, search, country, city, district, page, limit } = parsed.data;

    // ── Step 0: Resolve tag filter ───────────────────────────────────────────
    let tagFilteredRecipeIds: string[] | null = null;

    if (tagIds) {
      const parsedTagIds = tagIds
        .split(",")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0);

      if (parsedTagIds.length > 0) {
        // Find recipes that have ALL the requested tags
        const { data: tagRows, error: tagErr } = await supabase
          .from("recipe_dietary_tags")
          .select("recipe_id, tag_id")
          .in("tag_id", parsedTagIds);

        if (tagErr) {
          return res.status(500).json(errorResponse("DB_ERROR", tagErr.message));
        }

        // Group by recipe_id and keep only those that have every requested tag
        const recipeTagCounts = new Map<string, number>();
        for (const row of tagRows ?? []) {
          recipeTagCounts.set(
            row.recipe_id,
            (recipeTagCounts.get(row.recipe_id) ?? 0) + 1
          );
        }

        tagFilteredRecipeIds = [];
        for (const [recipeId, count] of recipeTagCounts) {
          if (count >= parsedTagIds.length) {
            tagFilteredRecipeIds.push(recipeId);
          }
        }

        // No recipes match all tags → return empty immediately
        if (tagFilteredRecipeIds.length === 0) {
          return res.status(200).json(
            successResponse({
              recipes: [],
              pagination: { page, limit, total: 0 },
            })
          );
        }
      }
    }

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
        `id, title, type, average_rating, rating_count,
         country, city, district,
         created_at, updated_at,
         dish_variety:dish_varieties!recipes_dish_variety_id_fkey(
           id, name,
           dish_genre:dish_genres!dish_varieties_genre_id_fkey(id, name)
         ),
         profile:profiles!recipes_creator_id_fkey(id, username),
         recipe_media(id, url, type)`,
        { count: "exact" }
      )
      .eq("is_published", true);

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (country) {
      query = query.eq("country", country);
    }

    if (city) {
      query = query.eq("city", city);
    }

    if (district) {
      query = query.eq("district", district);
    }

    if (varietyId !== undefined) {
      query = query.eq("dish_variety_id", varietyId);
    } else if (varietyIdsForGenre !== null) {
      query = query.in("dish_variety_id", varietyIdsForGenre);
    }

    if (excludedRecipeIds.length > 0) {
      query = query.not("id", "in", `(${excludedRecipeIds.join(",")})`);
    }

    if (tagFilteredRecipeIds !== null) {
      query = query.in("id", tagFilteredRecipeIds);
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
        recipes: (recipes ?? []).map((r: any) => {
          const firstImage = (r.recipe_media ?? []).find((m: any) => m.type === "image");
          const { recipe_media, ...rest } = r;
          return { ...rest, image_url: firstImage?.url ?? null };
        }),
        pagination: {
          page,
          limit,
          total: count ?? 0,
        },
      })
    );
  }
);

// ─── GET /discovery/recipes/by-ingredients ───────────────────────────────────
// Returns published recipes whose ingredients are fully covered by the provided
// ingredient list. Partial matches are excluded.
//   ?ingredientIds=1,2,3   (comma-separated ingredient IDs, required)
//   ?page=1&limit=20

const byIngredientsQuerySchema = z.object({
  ingredientIds: z.string().min(1, "ingredientIds is required"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get("/recipes/by-ingredients", async (req, res) => {
    const parsed = byIngredientsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return res.status(400).json(errorResponse("VALIDATION_ERROR", message));
    }

    const { page, limit } = parsed.data;

    // Parse and validate ingredient IDs
    const ingredientIds = parsed.data.ingredientIds
      .split(",")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0);

    if (ingredientIds.length === 0) {
      return res
        .status(400)
        .json(errorResponse("VALIDATION_ERROR", "ingredientIds must contain at least one valid positive integer"));
    }

    // ── Step 1: Find recipes that use ingredients NOT in the provided list ────
    // These recipes cannot be fully made with the available ingredients.
    const { data: excludedRows, error: excludeErr } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id")
      .not("ingredient_id", "in", `(${ingredientIds.join(",")})`);

    if (excludeErr) {
      return res
        .status(500)
        .json(errorResponse("DB_ERROR", excludeErr.message));
    }

    const excludedRecipeIds = [
      ...new Set(excludedRows?.map((r) => r.recipe_id) ?? []),
    ];

    // ── Step 2: Find published recipes that have at least one ingredient ──────
    // (recipes with no ingredients are excluded — they have no ingredient list to match)
    const { data: recipesWithIngredients, error: riErr } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id")
      .in("ingredient_id", ingredientIds);

    if (riErr) {
      return res
        .status(500)
        .json(errorResponse("DB_ERROR", riErr.message));
    }

    const candidateRecipeIds = [
      ...new Set(recipesWithIngredients?.map((r) => r.recipe_id) ?? []),
    ];

    // Keep only candidates that are NOT excluded
    const eligibleRecipeIds = candidateRecipeIds.filter(
      (id) => !excludedRecipeIds.includes(id)
    );

    if (eligibleRecipeIds.length === 0) {
      return res.status(200).json(
        successResponse({
          recipes: [],
          pagination: { page, limit, total: 0 },
        })
      );
    }

    // ── Step 3: Fetch full recipe data for eligible IDs ──────────────────────
    let query = supabase
      .from("recipes")
      .select(
        `id, title, type, average_rating, rating_count,
         country, city, district,
         created_at, updated_at,
         dish_variety:dish_varieties!recipes_dish_variety_id_fkey(
           id, name,
           dish_genre:dish_genres!dish_varieties_genre_id_fkey(id, name)
         ),
         profile:profiles!recipes_creator_id_fkey(id, username),
         recipe_media(id, url, type)`,
        { count: "exact" }
      )
      .eq("is_published", true)
      .in("id", eligibleRecipeIds);

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
        recipes: (recipes ?? []).map((r: any) => {
          const firstImage = (r.recipe_media ?? []).find((m: any) => m.type === "image");
          const { recipe_media, ...rest } = r;
          return { ...rest, image_url: firstImage?.url ?? null };
        }),
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
