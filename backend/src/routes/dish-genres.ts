import { Router } from "express";
import { z } from "zod";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { parseLangParam, resolveLang } from "../utils/i18n.js";
import { translateLabel } from "./cultural-tags.js";

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

// ─── POST /dish-genres/requests ───────────────────────────────────────────────
// Expert submits a request for a new dish genre.
// At least one of nameEn or nameTr must be provided.
// The missing language is auto-translated via DeepL.

const genreRequestSchema = z.object({
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
  validate(genreRequestSchema),
  async (req, res): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const { nameEn, nameTr, descriptionEn, descriptionTr } = req.body as z.infer<typeof genreRequestSchema>;
    const userClient = createUserClient(user.accessToken);

    let resolvedEn = nameEn ?? null;
    let resolvedTr = nameTr ?? null;

    // Translate the missing language via DeepL
    if (resolvedEn && !resolvedTr) {
      resolvedTr = await translateLabel(resolvedEn, "tr");
    } else if (resolvedTr && !resolvedEn) {
      resolvedEn = await translateLabel(resolvedTr, "en-US");
    }

    const { data, error } = await userClient
      .from("dish_genre_requests")
      .insert({
        requested_by:   user.profileId,
        name_en:        resolvedEn,
        name_tr:        resolvedTr,
        description_en: descriptionEn ?? null,
        description_tr: descriptionTr ?? null,
        status:         "pending",
      })
      .select("id, name_en, name_tr, description_en, description_tr, status, created_at")
      .single();

    if (error) {
      res.status(500).json(errorResponse("DB_ERROR", error.message));
      return;
    }

    res.status(201).json(successResponse({
      id:            (data as any).id,
      nameEn:        (data as any).name_en,
      nameTr:        (data as any).name_tr,
      descriptionEn: (data as any).description_en ?? null,
      descriptionTr: (data as any).description_tr ?? null,
      status:        (data as any).status,
      createdAt:     (data as any).created_at,
    }));
  }
);

// ─── GET /dish-genres/requests/me ─────────────────────────────────────────────
// Returns the authenticated user's own genre requests.

router.get("/requests/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;

  const { data, error } = await supabase
    .from("dish_genre_requests")
    .select("id, name_en, name_tr, description_en, description_tr, status, decision_note, created_at, decided_at")
    .eq("requested_by", user.profileId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(successResponse(
    (data ?? []).map((r: any) => ({
      id:            r.id,
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
