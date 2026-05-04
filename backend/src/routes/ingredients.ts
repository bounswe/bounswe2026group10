import { Router } from "express";
import { z } from "zod";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { parseLangParam, resolveLang } from "../utils/i18n.js";
import { buildSearchVariants, normalizeText } from "../utils/text.js";
import { escapeLikePattern } from "../utils/locations.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// ─── GET /ingredients ────────────────────────────────────────────────────────
// Search ingredients by partial name match (case-insensitive).
// Query params:
//   search — partial ingredient name (optional)
//   lang   — "en" or "tr"; when provided returns a single resolved `name` field
//             instead of the full name_en / name_tr pair

router.get("/", async (req, res) => {
  const lang = parseLangParam(req.query["lang"]);
  if (lang === "invalid") {
    return res.status(400).json(errorResponse("VALIDATION_ERROR", "lang must be 'en' or 'tr'."));
  }

  const search = (req.query["search"] as string | undefined)?.trim();

  let query = supabase.from("ingredients").select("id, name, name_en, name_tr");

  // Turkish-aware partial match across `name`, `name_en`, `name_tr` so a
  // search for "biber" or "BIBER" still matches rows stored only as
  // "Biber"/"biber" in either language column (#402).
  if (search) {
    const variants = buildSearchVariants(search);
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

  const { data, error } = await query.order("name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  if (lang) {
    return res.status(200).json(successResponse(
      (data as any[]).map((row) => ({
        id: row.id,
        name: resolveLang(row.name_en, row.name_tr, lang) ?? row.name,
      }))
    ));
  }

  return res.status(200).json(successResponse(data));
});

// ─── POST /ingredients ───────────────────────────────────────────────────────
// Create a new ingredient.
// Restricted to cook and expert roles.
// Body: { name_en?: string, name_tr?: string } — at least one field required.
// Returns 409 if an ingredient with the same primary name already exists.

const createIngredientSchema = z
  .object({
    name_en: z.string().trim().min(1, { message: "name_en cannot be empty." }).optional(),
    name_tr: z.string().trim().min(1, { message: "name_tr cannot be empty." }).optional(),
  })
  .refine((d) => !!(d.name_en || d.name_tr), {
    message: "At least one of name_en or name_tr must be provided.",
  });

router.post(
  "/",
  requireAuth,
  requireRole("cook", "expert"),
  validate(createIngredientSchema),
  async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const { name_en, name_tr } = req.body as z.infer<typeof createIngredientSchema>;
    const userClient = createUserClient(user.accessToken);

    // NFC-normalize so e.g. decomposed "c"+combining-cedilla and precomposed
    // "ç" hash to the same row (#402).
    const normalizedEn = normalizeText(name_en);
    const normalizedTr = normalizeText(name_tr);

    // Derive the canonical name (used for the legacy `name` column and duplicate check).
    // Lowercase via Turkish locale so `İ → i` and `I → ı` instead of the en-locale `I → i`.
    const primaryName = (normalizedEn ?? normalizedTr!).toLocaleLowerCase("tr-TR");

    const { data: existing } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("name", primaryName)
      .maybeSingle();

    if (existing) {
      return res.status(409).json(errorResponse("CONFLICT", "An ingredient with this name already exists."));
    }

    const { data, error } = await userClient
      .from("ingredients")
      .insert({
        name: primaryName,
        name_en: normalizedEn?.toLocaleLowerCase("tr-TR") ?? null,
        name_tr: normalizedTr?.toLocaleLowerCase("tr-TR") ?? null,
      })
      .select("id, name, name_en, name_tr")
      .single();

    if (error) {
      return res.status(500).json(errorResponse("DB_ERROR", error.message));
    }

    return res.status(201).json(successResponse(data));
  }
);

export default router;
