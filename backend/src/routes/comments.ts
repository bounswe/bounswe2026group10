import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";

const router = Router();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const commentBodySchema = z
  .string()
  .trim()
  .min(1, { message: "Comment body must not be empty." })
  .max(2000, { message: "Comment body must be at most 2000 characters." });

const createCommentSchema = z.object({
  body: commentBodySchema,
  score: z
    .number({ message: "Score must be a number." })
    .int({ message: "Score must be an integer." })
    .min(1, { message: "Score must be at least 1." })
    .max(5, { message: "Score must be at most 5." })
    .optional(),
});

const updateCommentSchema = z.object({
  body: commentBodySchema,
});

const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── POST /recipes/:id/comments ───────────────────────────────────────────────

/**
 * Create a comment on a recipe. Amazon-style coupling with ratings:
 *   - The user must have a rating on the recipe to comment.
 *   - Optionally accept a `score` in the same request to upsert the rating.
 *   - Recipe creators may comment on their own recipe without a rating
 *     (since self-rating is forbidden); a `score` from the creator returns 403.
 */
router.post(
  "/recipes/:id/comments",
  requireAuth,
  validate(createCommentSchema),
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const recipeId = (req.params["id"] ?? "") as string;
    const { body, score } = req.body as z.infer<typeof createCommentSchema>;
    const userClient = createUserClient(user.accessToken);

    // 1. Verify recipe exists and check creator
    const { data: recipe, error: fetchError } = await supabase
      .from("recipes")
      .select("id, creator_id")
      .eq("id", recipeId)
      .single();

    if (fetchError || !recipe) {
      if (fetchError?.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
        return;
      }
      res.status(500).json(errorResponse("DB_ERROR", fetchError?.message ?? "Failed to fetch recipe."));
      return;
    }

    const isCreator = (recipe as any).creator_id === user.profileId;

    // 2. Self-rating guard — creators cannot rate their own recipe
    if (isCreator && score !== undefined) {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "You cannot rate your own recipe."));
      return;
    }

    // 3. Enforce one comment per user per recipe — the user must edit instead of stacking
    const { data: existingComment, error: existingCommentError } = await supabase
      .from("comments")
      .select("id")
      .eq("recipe_id", recipeId)
      .eq("user_id", user.profileId)
      .single();

    if (existingCommentError && existingCommentError.code !== "PGRST116") {
      res.status(500).json(errorResponse("DB_ERROR", existingCommentError.message));
      return;
    }

    if (existingComment) {
      res
        .status(409)
        .json(
          errorResponse(
            "COMMENT_ALREADY_EXISTS",
            "You have already commented on this recipe. Edit your existing comment instead."
          )
        );
      return;
    }

    // 4. Ensure a rating exists for non-creators (either provided in this call or already on file)
    let rating: any = null;

    if (!isCreator) {
      if (score !== undefined) {
        const { data: upserted, error: upsertError } = await userClient
          .from("ratings")
          .upsert(
            { recipe_id: recipeId, user_id: user.profileId, score },
            { onConflict: "recipe_id,user_id" }
          )
          .select("id, score, created_at, updated_at")
          .single();

        if (upsertError || !upserted) {
          res
            .status(500)
            .json(errorResponse("DB_ERROR", upsertError?.message ?? "Failed to save rating."));
          return;
        }

        rating = upserted;
      } else {
        const { data: existing, error: ratingFetchError } = await supabase
          .from("ratings")
          .select("id, score, created_at, updated_at")
          .eq("recipe_id", recipeId)
          .eq("user_id", user.profileId)
          .single();

        if (ratingFetchError && ratingFetchError.code !== "PGRST116") {
          res.status(500).json(errorResponse("DB_ERROR", ratingFetchError.message));
          return;
        }

        if (!existing) {
          res
            .status(400)
            .json(
              errorResponse(
                "RATING_REQUIRED",
                "You must rate this recipe before commenting. Include a 'score' (1–5) in the request, or rate first."
              )
            );
          return;
        }

        rating = existing;
      }
    }

    // 5. Insert the comment
    const { data: inserted, error: insertError } = await userClient
      .from("comments")
      .insert({
        recipe_id: recipeId,
        user_id: user.profileId,
        text: body,
      })
      .select("id, recipe_id, user_id, text, created_at, updated_at")
      .single();

    if (insertError || !inserted) {
      // Postgres unique_violation — the existence check above lost a race with a concurrent insert,
      // or another path created a comment for this user. Map to the same 409 the existence check returns.
      if (insertError?.code === "23505") {
        res
          .status(409)
          .json(
            errorResponse(
              "COMMENT_ALREADY_EXISTS",
              "You have already commented on this recipe. Edit your existing comment instead."
            )
          );
        return;
      }
      res
        .status(500)
        .json(errorResponse("DB_ERROR", insertError?.message ?? "Failed to create comment."));
      return;
    }

    res.status(201).json(
      successResponse({
        comment: {
          id: (inserted as any).id,
          recipeId: (inserted as any).recipe_id,
          userId: (inserted as any).user_id,
          username: user.username,
          body: (inserted as any).text,
          createdAt: (inserted as any).created_at,
          updatedAt: (inserted as any).updated_at,
        },
        rating: rating
          ? {
              id: rating.id,
              score: rating.score,
              createdAt: rating.created_at,
              updatedAt: rating.updated_at,
            }
          : null,
      })
    );
  }
);

// ─── GET /recipes/:id/comments ────────────────────────────────────────────────

/**
 * List comments on a recipe with pagination.
 * Public — no auth required.
 * Ordered by created_at descending (newest first).
 */
router.get("/recipes/:id/comments", async (req: Request, res: Response): Promise<void> => {
  const recipeId = (req.params["id"] ?? "") as string;

  const parsed = listCommentsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid query parameters.";
    res.status(400).json(errorResponse("VALIDATION_ERROR", message));
    return;
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("comments")
    .select(
      `id, recipe_id, user_id, text, created_at, updated_at,
       author:profiles!comments_user_id_fkey(id, username)`,
      { count: "exact" }
    )
    .eq("recipe_id", recipeId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  // Fetch each commenter's rating on this recipe so the response includes the score alongside the body.
  // Recipe creators are allowed to comment without a rating, so their score may legitimately be null.
  const userIds = Array.from(new Set((data ?? []).map((c: any) => c.user_id)));
  const ratingByUser: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: ratingsData, error: ratingsError } = await supabase
      .from("ratings")
      .select("user_id, score")
      .eq("recipe_id", recipeId)
      .in("user_id", userIds);

    if (ratingsError) {
      res.status(500).json(errorResponse("DB_ERROR", ratingsError.message));
      return;
    }

    for (const r of ratingsData ?? []) {
      ratingByUser[(r as any).user_id] = (r as any).score;
    }
  }

  const comments = (data ?? []).map((c: any) => ({
    id: c.id,
    recipeId: c.recipe_id,
    userId: c.user_id,
    username: c.author?.username ?? null,
    body: c.text,
    score: ratingByUser[c.user_id] ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  res.status(200).json(
    successResponse({
      comments,
      pagination: { page, limit, total: count ?? 0 },
    })
  );
});

// ─── PATCH /comments/:id ─────────────────────────────────────────────────────

/**
 * Edit a comment.
 * Auth required: Yes. Only the comment author may edit their own comment.
 */
router.patch(
  "/comments/:id",
  requireAuth,
  validate(updateCommentSchema),
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const commentId = (req.params["id"] ?? "") as string;
    const { body } = req.body as z.infer<typeof updateCommentSchema>;
    const userClient = createUserClient(user.accessToken);

    // 1. Fetch comment to verify ownership
    const { data: comment, error: fetchError } = await userClient
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      if (fetchError?.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Comment not found."));
        return;
      }
      res.status(500).json(errorResponse("DB_ERROR", fetchError?.message ?? "Failed to fetch comment."));
      return;
    }

    if ((comment as any).user_id !== user.profileId) {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "You can only edit your own comments."));
      return;
    }

    // 2. Update
    const { data: updated, error: updateError } = await userClient
      .from("comments")
      .update({ text: body, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .select("id, recipe_id, user_id, text, created_at, updated_at")
      .single();

    if (updateError || !updated) {
      res
        .status(500)
        .json(errorResponse("DB_ERROR", updateError?.message ?? "Failed to update comment."));
      return;
    }

    res.status(200).json(
      successResponse({
        id: (updated as any).id,
        recipeId: (updated as any).recipe_id,
        userId: (updated as any).user_id,
        username: user.username,
        body: (updated as any).text,
        createdAt: (updated as any).created_at,
        updatedAt: (updated as any).updated_at,
      })
    );
  }
);

// ─── DELETE /comments/:id ─────────────────────────────────────────────────────

/**
 * Delete a comment.
 * Auth required: Yes. Only the comment author may delete their own comment.
 */
router.delete(
  "/comments/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const commentId = (req.params["id"] ?? "") as string;
    const userClient = createUserClient(user.accessToken);

    // 1. Fetch comment to verify ownership
    const { data: comment, error: fetchError } = await userClient
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      if (fetchError?.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Comment not found."));
        return;
      }
      res.status(500).json(errorResponse("DB_ERROR", fetchError?.message ?? "Failed to fetch comment."));
      return;
    }

    if ((comment as any).user_id !== user.profileId) {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "You can only delete your own comments."));
      return;
    }

    // 2. Delete it
    const { error: deleteError } = await userClient
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      res.status(500).json(errorResponse("DB_ERROR", deleteError.message));
      return;
    }

    res.status(204).send();
  }
);

export default router;
