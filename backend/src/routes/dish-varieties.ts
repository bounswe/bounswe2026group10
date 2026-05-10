import { Router } from "express";
import { z } from "zod";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { parseLangParam, resolveLang } from "../utils/i18n.js";
import { buildSearchVariants } from "../utils/text.js";
import { escapeLikePattern } from "../utils/locations.js";
import { translateLabel } from "./cultural-tags.js";

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
      // Turkish-aware partial match across `name`, `name_en`, `name_tr` so a
      // search for "borek" or "BÖREK" still matches "Börek" stored in either
      // language column (#402).
      const variants = buildSearchVariants(trimmed);
      if (variants.length > 0) {
        const columns = ["name", "name_en", "name_tr"] as const;
        const orFilter = variants
          .flatMap((v) =>
            columns.map((c) => `${c}.ilike.%${escapeLikePattern(v)}%`)
          )
          .join(",");
        query = query.or(orFilter);
      }
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

// ─── POST /dish-varieties/requests ────────────────────────────────────────────
// Expert submits a request for a new dish variety within a genre.
// At least one of nameEn or nameTr must be provided.

const varietyRequestSchema = z.object({
  genreId:       z.number().int().positive(),
  nameEn:        z.string().trim().min(2).max(200).optional(),
  nameTr:        z.string().trim().min(2).max(200).optional(),
  descriptionEn: z.string().trim().max(2000).optional(),
  descriptionTr: z.string().trim().max(2000).optional(),
}).refine((d) => d.nameEn || d.nameTr, {
  message: "At least one of nameEn or nameTr is required.",
});

router.post(
  "/requests",
  requireAuth,
  requireRole("expert"),
  validate(varietyRequestSchema),
  async (req, res): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const { genreId, nameEn, nameTr, descriptionEn, descriptionTr } = req.body as z.infer<typeof varietyRequestSchema>;
    const userClient = createUserClient(user.accessToken);

    // Validate that the genre exists
    const { data: genre, error: genreError } = await supabase
      .from("dish_genres")
      .select("id")
      .eq("id", genreId)
      .maybeSingle();

    if (genreError) {
      res.status(500).json(errorResponse("DB_ERROR", genreError.message));
      return;
    }
    if (!genre) {
      res.status(404).json(errorResponse("NOT_FOUND", "Dish genre not found."));
      return;
    }

    let resolvedEn = nameEn ?? null;
    let resolvedTr = nameTr ?? null;

    // Translate the missing language via DeepL
    if (resolvedEn && !resolvedTr) {
      resolvedTr = await translateLabel(resolvedEn, "tr");
    } else if (resolvedTr && !resolvedEn) {
      resolvedEn = await translateLabel(resolvedTr, "en-US");
    }

    const { data, error } = await userClient
      .from("dish_variety_requests")
      .insert({
        requested_by:   user.profileId,
        genre_id:       genreId,
        name_en:        resolvedEn,
        name_tr:        resolvedTr,
        description_en: descriptionEn ?? null,
        description_tr: descriptionTr ?? null,
        status:         "pending",
      })
      .select("id, genre_id, name_en, name_tr, description_en, description_tr, status, created_at")
      .single();

    if (error) {
      res.status(500).json(errorResponse("DB_ERROR", error.message));
      return;
    }

    res.status(201).json(successResponse({
      id:            (data as any).id,
      genreId:       (data as any).genre_id,
      nameEn:        (data as any).name_en,
      nameTr:        (data as any).name_tr,
      descriptionEn: (data as any).description_en ?? null,
      descriptionTr: (data as any).description_tr ?? null,
      status:        (data as any).status,
      createdAt:     (data as any).created_at,
    }));
  }
);

// ─── GET /dish-varieties/requests/me ──────────────────────────────────────────
// Returns the authenticated user's own variety requests.

router.get("/requests/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;

  const { data, error } = await supabase
    .from("dish_variety_requests")
    .select("id, genre_id, name_en, name_tr, description_en, description_tr, status, decision_note, created_at, decided_at")
    .eq("requested_by", user.profileId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(successResponse(
    (data ?? []).map((r: any) => ({
      id:            r.id,
      genreId:       r.genre_id,
      nameEn:        r.name_en,
      nameTr:        r.name_tr,
      descriptionEn: r.description_en ?? null,
      descriptionTr: r.description_tr ?? null,
      status:        r.status,
      decisionNote:  r.decision_note ?? null,
      createdAt:     r.created_at,
      decidedAt:     r.decided_at ?? null,
    }))
  ));
});

export default router;
