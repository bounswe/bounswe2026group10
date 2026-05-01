import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";

const router = Router();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const listFavoritesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── POST /users/me/favorites/:recipeId ───────────────────────────────────────

router.post("/me/favorites/:recipeId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const recipeId = req.params["recipeId"] as string;

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("is_published", true)
    .maybeSingle();

  if (!recipe) {
    res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
    return;
  }

  const { error } = await supabase
    .from("user_favorites")
    .insert({ user_id: user.profileId, recipe_id: recipeId });

  if (error) {
    if (error.code === "23505") {
      res.status(409).json(errorResponse("CONFLICT", "Recipe is already in favorites."));
      return;
    }
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(201).json(successResponse({ recipeId, favorited: true }));
});

// ─── DELETE /users/me/favorites/:recipeId ─────────────────────────────────────

router.delete("/me/favorites/:recipeId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const recipeId = req.params["recipeId"] as string;

  const { data, error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", user.profileId)
    .eq("recipe_id", recipeId)
    .select("id")
    .maybeSingle();

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  if (!data) {
    res.status(404).json(errorResponse("NOT_FOUND", "Favorite not found."));
    return;
  }

  res.status(204).send();
});

// ─── GET /users/me/favorites ──────────────────────────────────────────────────

router.get("/me/favorites", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;

  const parsed = listFavoritesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid query parameters.";
    res.status(400).json(errorResponse("VALIDATION_ERROR", message));
    return;
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("user_favorites")
    .select(
      `recipe:recipes(
        id, title, type, average_rating, rating_count, created_at, updated_at,
        creator:profiles!recipes_creator_id_fkey(id, username),
        dish_variety:dish_varieties(id, name, dish_genre:dish_genres(id, name)),
        recipe_media(id, url, type)
      )`,
      { count: "exact" }
    )
    .eq("user_id", user.profileId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  const recipes = (data ?? []).map((fav: any) => {
    const r = fav.recipe;
    const firstImage = (r?.recipe_media ?? []).find((m: any) => m.type === "image");
    return {
      id: r?.id ?? null,
      title: r?.title ?? null,
      type: r?.type ?? null,
      averageRating: r?.average_rating ?? null,
      ratingCount: r?.rating_count ?? 0,
      creatorId: r?.creator?.id ?? null,
      creatorUsername: r?.creator?.username ?? null,
      dishVarietyId: r?.dish_variety?.id ?? null,
      dishVarietyName: r?.dish_variety?.name ?? null,
      genreName: r?.dish_variety?.dish_genre?.name ?? null,
      createdAt: r?.created_at ?? null,
      updatedAt: r?.updated_at ?? null,
      coverImageUrl: firstImage?.url ?? null,
    };
  });

  res.status(200).json(
    successResponse({
      recipes,
      pagination: { page, limit, total: count ?? 0 },
    })
  );
});

export default router;
