import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { normalizeText } from "../utils/text.js";

const router = Router();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const noteSchema = z
  .string()
  .trim()
  .min(1, { message: "Note must not be empty." })
  .max(500, { message: "Note must be at most 500 characters." });

const techniqueSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .nullable()
  .optional();

const createAnnotationSchema = z
  .object({
    startTime: z
      .number({ message: "startTime must be a number." })
      .min(0, { message: "startTime must be at least 0 seconds." }),
    endTime: z
      .number({ message: "endTime must be a number." })
      .min(0, { message: "endTime must be at least 0 seconds." }),
    note: noteSchema,
    technique: techniqueSchema,
  })
  .refine((b) => b.endTime >= b.startTime, {
    message: "endTime must be greater than or equal to startTime.",
    path: ["endTime"],
  });

const updateAnnotationSchema = z
  .object({
    startTime: z.number().min(0).optional(),
    endTime: z.number().min(0).optional(),
    note: noteSchema.optional(),
    technique: techniqueSchema,
  })
  .refine(
    (b) =>
      b.startTime !== undefined ||
      b.endTime !== undefined ||
      b.note !== undefined ||
      b.technique !== undefined,
    { message: "At least one field (startTime, endTime, note, technique) must be provided." }
  );

// ─── Serializer ──────────────────────────────────────────────────────────────

const toApiAnnotation = (row: any) => ({
  id: row.id,
  recipeId: row.recipe_id,
  startTime: Number(row.start_time),
  endTime: Number(row.end_time),
  note: row.note,
  technique: row.technique ?? null,
  createdAt: row.created_at,
});

// ─── POST /recipes/:id/annotations ────────────────────────────────────────────

/**
 * Create a video annotation (timestamp + note) on a recipe.
 * Restricted to cook/expert. Caller must be the recipe creator.
 */
router.post(
  "/recipes/:id/annotations",
  requireAuth,
  requireRole("cook", "expert"),
  validate(createAnnotationSchema),
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const recipeId = (req.params["id"] ?? "") as string;
    const body = req.body as z.infer<typeof createAnnotationSchema>;
    const userClient = createUserClient(user.accessToken);

    // 1. Verify recipe exists and caller is the creator
    const { data: recipe, error: fetchError } = await userClient
      .from("recipes")
      .select("id, creator_id")
      .eq("id", recipeId)
      .single();

    if (fetchError || !recipe) {
      if (fetchError?.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
        return;
      }
      res
        .status(500)
        .json(errorResponse("DB_ERROR", fetchError?.message ?? "Failed to fetch recipe."));
      return;
    }

    if ((recipe as any).creator_id !== user.profileId) {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "Only the recipe creator can add annotations."));
      return;
    }

    // 2. Insert annotation — NFC-normalize free text (#402)
    const normalizedNote = normalizeText(body.note) ?? body.note;
    const normalizedTechnique =
      body.technique == null ? null : normalizeText(body.technique);

    const { data: inserted, error: insertError } = await userClient
      .from("video_annotations")
      .insert({
        recipe_id: recipeId,
        start_time: body.startTime,
        end_time: body.endTime,
        note: normalizedNote,
        technique: normalizedTechnique,
      })
      .select("id, recipe_id, start_time, end_time, note, technique, created_at")
      .single();

    if (insertError || !inserted) {
      res
        .status(500)
        .json(errorResponse("DB_ERROR", insertError?.message ?? "Failed to create annotation."));
      return;
    }

    res.status(201).json(successResponse(toApiAnnotation(inserted)));
  }
);

// ─── GET /recipes/:id/annotations ─────────────────────────────────────────────

/**
 * List video annotations for a recipe, ordered by timestamp ascending.
 * Public for published recipes; for drafts only the creator may read.
 */
router.get(
  "/recipes/:id/annotations",
  async (req: Request, res: Response): Promise<void> => {
    const recipeId = (req.params["id"] ?? "") as string;

    // Resolve viewer (optional) so drafts are visible to their creator
    const authHeader = req.headers["authorization"];
    const token =
      authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("id, is_published, creator_id")
      .eq("id", recipeId)
      .single();

    if (recipeError || !recipe) {
      if (recipeError?.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
        return;
      }
      res
        .status(500)
        .json(errorResponse("DB_ERROR", recipeError?.message ?? "Failed to fetch recipe."));
      return;
    }

    if (!(recipe as any).is_published) {
      let viewerProfileId: string | null = null;
      if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", userData.user.id)
            .maybeSingle();
          viewerProfileId = (profile as any)?.id ?? null;
        }
      }
      if (viewerProfileId !== (recipe as any).creator_id) {
        res
          .status(403)
          .json(errorResponse("FORBIDDEN", "This recipe is a draft."));
        return;
      }
    }

    const { data, error } = await supabase
      .from("video_annotations")
      .select("id, recipe_id, start_time, end_time, note, technique, created_at")
      .eq("recipe_id", recipeId)
      .order("start_time", { ascending: true });

    if (error) {
      res.status(500).json(errorResponse("DB_ERROR", error.message));
      return;
    }

    res
      .status(200)
      .json(successResponse((data ?? []).map(toApiAnnotation)));
  }
);

// ─── PATCH /annotations/:annotationId ─────────────────────────────────────────

/**
 * Update a single video annotation.
 * Auth required: only the recipe creator may edit.
 */
router.patch(
  "/annotations/:annotationId",
  requireAuth,
  validate(updateAnnotationSchema),
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const annotationId = (req.params["annotationId"] ?? "") as string;
    const body = req.body as z.infer<typeof updateAnnotationSchema>;
    const userClient = createUserClient(user.accessToken);

    // 1. Fetch annotation + parent recipe creator for ownership check.
    // Also pull current start/end so we can validate the post-update range
    // when the caller only sends one side of it.
    const { data: existing, error: fetchError } = await userClient
      .from("video_annotations")
      .select(
        "id, recipe_id, start_time, end_time, recipe:recipes!video_annotations_recipe_id_fkey(creator_id)"
      )
      .eq("id", annotationId)
      .single();

    if (fetchError || !existing) {
      if (fetchError?.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Annotation not found."));
        return;
      }
      res
        .status(500)
        .json(errorResponse("DB_ERROR", fetchError?.message ?? "Failed to fetch annotation."));
      return;
    }

    const creatorId = (existing as any).recipe?.creator_id;
    if (creatorId !== user.profileId) {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "You can only edit annotations on your own recipes."));
      return;
    }

    // 2. Range invariant check against the merged (existing + patched) values.
    const nextStart =
      body.startTime !== undefined ? body.startTime : Number((existing as any).start_time);
    const nextEnd =
      body.endTime !== undefined ? body.endTime : Number((existing as any).end_time);
    if (nextEnd < nextStart) {
      res
        .status(400)
        .json(
          errorResponse(
            "VALIDATION_ERROR",
            "endTime must be greater than or equal to startTime."
          )
        );
      return;
    }

    // 3. Update — only set provided fields
    const update: Record<string, unknown> = {};
    if (body.startTime !== undefined) update["start_time"] = body.startTime;
    if (body.endTime !== undefined) update["end_time"] = body.endTime;
    if (body.note !== undefined) {
      update["note"] = normalizeText(body.note) ?? body.note;
    }
    if (body.technique !== undefined) {
      update["technique"] =
        body.technique == null ? null : normalizeText(body.technique);
    }

    const { data: updated, error: updateError } = await userClient
      .from("video_annotations")
      .update(update)
      .eq("id", annotationId)
      .select("id, recipe_id, start_time, end_time, note, technique, created_at")
      .single();

    if (updateError || !updated) {
      res
        .status(500)
        .json(errorResponse("DB_ERROR", updateError?.message ?? "Failed to update annotation."));
      return;
    }

    res.status(200).json(successResponse(toApiAnnotation(updated)));
  }
);

// ─── DELETE /annotations/:annotationId ────────────────────────────────────────

/**
 * Delete a single video annotation.
 * Auth required: only the recipe creator may delete.
 */
router.delete(
  "/annotations/:annotationId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const annotationId = (req.params["annotationId"] ?? "") as string;
    const userClient = createUserClient(user.accessToken);

    const { data: existing, error: fetchError } = await userClient
      .from("video_annotations")
      .select("id, recipe_id, recipe:recipes!video_annotations_recipe_id_fkey(creator_id)")
      .eq("id", annotationId)
      .single();

    if (fetchError || !existing) {
      if (fetchError?.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Annotation not found."));
        return;
      }
      res
        .status(500)
        .json(errorResponse("DB_ERROR", fetchError?.message ?? "Failed to fetch annotation."));
      return;
    }

    const creatorId = (existing as any).recipe?.creator_id;
    if (creatorId !== user.profileId) {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "You can only delete annotations on your own recipes."));
      return;
    }

    const { error: deleteError } = await userClient
      .from("video_annotations")
      .delete()
      .eq("id", annotationId);

    if (deleteError) {
      res.status(500).json(errorResponse("DB_ERROR", deleteError.message));
      return;
    }

    res.status(204).send();
  }
);

export default router;
