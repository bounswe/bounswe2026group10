import { Router } from "express";
import { z } from "zod";
import { Translator, type TextResult } from "deepl-node";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Translates a single label via DeepL. Returns null if key is missing or call fails.
async function translateLabel(text: string, target: "en-US" | "tr"): Promise<string | null> {
  const apiKey = process.env["DEEPL_API_KEY"];
  if (!apiKey) return null;
  try {
    const translator = new Translator(apiKey);
    const result = (await translator.translateText(text, null, target)) as TextResult;
    return result.text;
  } catch {
    return null;
  }
}

// Produces a URL-safe key from a label, handling Turkish characters.
function slugify(text: string): string {
  return text
    .replace(/[İI]/g, "i").replace(/ı/g, "i")
    .replace(/[şŞ]/g, "s").replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export { slugify };

// ─── GET /cultural-tags ───────────────────────────────────────────────────────
// Returns curated cultural-event tags.
// Query params:
//   country — when provided, returns only global tags (country IS NULL) plus
//              tags scoped to that country. Omitting the param returns all tags.
//
// Response shape mirrors the mobile mock client:
//   { id, key, labelEn, labelTr, country }

router.get("/", async (req, res) => {
  const country = typeof req.query["country"] === "string"
    ? req.query["country"].trim()
    : null;

  let query = supabase
    .from("cultural_tags")
    .select("id, key, label_en, label_tr, country")
    .order("country", { nullsFirst: true })
    .order("key");

  if (country) {
    query = query.or(`country.is.null,country.eq.${country}`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  const tags = (data as any[]).map((row) => ({
    id:      row.id,
    key:     row.key,
    labelEn: row.label_en,
    labelTr: row.label_tr,
    country: row.country ?? null,
  }));

  return res.status(200).json(successResponse(tags));
});

// ─── POST /cultural-tags/requests ─────────────────────────────────────────────
// Expert submits a new cultural tag for admin review.
// At least one of labelEn or labelTr must be provided.
// The missing language is auto-translated via DeepL (falls back to null if unavailable).

const tagRequestSchema = z.object({
  labelEn: z.string().trim().min(2).max(100).optional(),
  labelTr: z.string().trim().min(2).max(100).optional(),
  country: z.string().trim().min(1).max(100).optional(),
}).refine((d) => d.labelEn || d.labelTr, {
  message: "At least one of labelEn or labelTr is required.",
});

router.post(
  "/requests",
  requireAuth,
  requireRole("expert"),
  validate(tagRequestSchema),
  async (req, res): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const { labelEn, labelTr, country } = req.body as z.infer<typeof tagRequestSchema>;
    const userClient = createUserClient(user.accessToken);

    let resolvedEn = labelEn ?? null;
    let resolvedTr = labelTr ?? null;

    // Translate the missing language via DeepL
    if (resolvedEn && !resolvedTr) {
      resolvedTr = await translateLabel(resolvedEn, "tr");
    } else if (resolvedTr && !resolvedEn) {
      resolvedEn = await translateLabel(resolvedTr, "en-US");
    }

    const { data, error } = await userClient
      .from("cultural_tag_requests")
      .insert({
        requested_by: user.profileId,
        label_en:     resolvedEn,
        label_tr:     resolvedTr,
        country:      country ?? null,
        status:       "pending",
      })
      .select("id, label_en, label_tr, country, status, created_at")
      .single();

    if (error) {
      res.status(500).json(errorResponse("DB_ERROR", error.message));
      return;
    }

    res.status(201).json(successResponse({
      id:        (data as any).id,
      labelEn:   (data as any).label_en,
      labelTr:   (data as any).label_tr,
      country:   (data as any).country ?? null,
      status:    (data as any).status,
      createdAt: (data as any).created_at,
    }));
  }
);

// ─── GET /cultural-tags/requests/me ──────────────────────────────────────────
// Returns the authenticated expert's own tag requests.

router.get("/requests/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;

  const { data, error } = await supabase
    .from("cultural_tag_requests")
    .select("id, label_en, label_tr, country, status, decision_note, created_at, decided_at")
    .eq("requested_by", user.profileId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(successResponse(
    (data ?? []).map((r: any) => ({
      id:           r.id,
      labelEn:      r.label_en,
      labelTr:      r.label_tr,
      country:      r.country ?? null,
      status:       r.status,
      decisionNote: r.decision_note ?? null,
      createdAt:    r.created_at,
      decidedAt:    r.decided_at ?? null,
    }))
  ));
});

export default router;
