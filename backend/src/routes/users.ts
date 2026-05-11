import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest, LanguageRequest } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { resolveLocalizedName } from "../utils/i18n.js";
import { fetchRecipeTitleTranslations } from "../services/translationService.js";

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
  const lang = (req as LanguageRequest).lang;
  const langParam: "EN" | "TR" | null = lang === "en" ? "EN" : lang === "tr" ? "TR" : null;

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
        id, title, type, average_rating, rating_count, allergen_ids, created_at, updated_at,
        creator:profiles!recipes_creator_id_fkey(id, username),
        dish_variety:dish_varieties(id, name, name_en, name_tr, dish_genre:dish_genres(id, name, name_en, name_tr)),
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

  const allAllergenIds = [
    ...new Set((data ?? []).flatMap((fav: any) => fav.recipe?.allergen_ids ?? [])),
  ] as number[];

  const allergenMap = new Map<number, string>();
  if (allAllergenIds.length > 0) {
    const { data: allergenRows } = await supabase
      .from("allergens")
      .select("id, name")
      .in("id", allAllergenIds);
    for (const a of allergenRows ?? []) {
      allergenMap.set(a.id, a.name);
    }
  }

  let titleMap = new Map<string, string>();
  if (langParam) {
    const ids = (data ?? [])
      .map((fav: any) => fav.recipe?.id)
      .filter((id: any): id is string => typeof id === "string");
    titleMap = await fetchRecipeTitleTranslations(ids, langParam);
  }

  const recipes = (data ?? []).map((fav: any) => {
    const r = fav.recipe;
    const firstImage = (r?.recipe_media ?? []).find((m: any) => m.type === "image");
    const allergens = (r?.allergen_ids ?? [])
      .map((id: number) => ({ id, name: allergenMap.get(id) ?? null }))
      .filter((a: any) => a.name !== null);
    return {
      id: r?.id ?? null,
      title: (r?.id && titleMap.get(r.id)) ?? r?.title ?? null,
      type: r?.type ?? null,
      averageRating: r?.average_rating ?? null,
      ratingCount: r?.rating_count ?? 0,
      creatorId: r?.creator?.id ?? null,
      creatorUsername: r?.creator?.username ?? null,
      dishVarietyId: r?.dish_variety?.id ?? null,
      dishVarietyName: resolveLocalizedName(r?.dish_variety, langParam),
      genreName: resolveLocalizedName(r?.dish_variety?.dish_genre, langParam),
      createdAt: r?.created_at ?? null,
      updatedAt: r?.updated_at ?? null,
      coverImageUrl: firstImage?.url ?? null,
      allergens,
    };
  });

  res.status(200).json(
    successResponse({
      recipes,
      pagination: { page, limit, total: count ?? 0 },
    })
  );
});

// ─── GET /users/me/drafts ─────────────────────────────────────────────────────

router.get("/me/drafts", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const userClient = createUserClient(user.accessToken);
  const lang = (req as LanguageRequest).lang;
  const langParam: "EN" | "TR" | null = lang === "en" ? "EN" : lang === "tr" ? "TR" : null;

  const { data, error } = await userClient
    .from("recipes")
    .select(
      `id, title, type, is_published, average_rating, rating_count, allergen_ids,
       country, city, district, created_at, updated_at,
       recipe_media(id, url, type)`
    )
    .eq("creator_id", user.profileId)
    .eq("is_published", false)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  const allAllergenIdsDrafts = [
    ...new Set((data ?? []).flatMap((r: any) => r.allergen_ids ?? [])),
  ] as number[];

  const allergenMapDrafts = new Map<number, string>();
  if (allAllergenIdsDrafts.length > 0) {
    const { data: allergenRows } = await supabase
      .from("allergens")
      .select("id, name")
      .in("id", allAllergenIdsDrafts);
    for (const a of allergenRows ?? []) {
      allergenMapDrafts.set(a.id, a.name);
    }
  }

  let titleMap = new Map<string, string>();
  if (langParam) {
    const ids = (data ?? []).map((r: any) => r.id);
    titleMap = await fetchRecipeTitleTranslations(ids, langParam);
  }

  const recipes = (data ?? []).map((r: any) => {
    const firstImage = (r.recipe_media ?? []).find((m: any) => m.type === "image");
    const allergens = (r.allergen_ids ?? [])
      .map((id: number) => ({ id, name: allergenMapDrafts.get(id) ?? null }))
      .filter((a: any) => a.name !== null);
    return {
      id: r.id,
      title: titleMap.get(r.id) ?? r.title,
      type: r.type,
      isPublished: r.is_published,
      averageRating: r.average_rating ?? null,
      ratingCount: r.rating_count ?? 0,
      country: r.country ?? null,
      city: r.city ?? null,
      district: r.district ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      coverImageUrl: firstImage?.url ?? null,
      allergens,
    };
  });

  res.status(200).json(successResponse(recipes));
});

export default router;
