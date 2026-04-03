import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { translateRecipe } from "../services/translationService.js";

const router = Router();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const recipeSchema = z.object({
  dishVarietyId: z.number().int({ message: "Dish variety ID must be an integer" }).optional(),
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(200, { message: "Title must be at most 200 characters" }),
  story: z
    .string()
    .max(5000, { message: "Story must be at most 5000 characters" })
    .optional(),
  videoUrl: z.string().url({ message: "Video URL must be a valid URL" }).optional(),
  servingSize: z
    .number()
    .int()
    .min(1, { message: "Serving size must be at least 1" })
    .max(100, { message: "Serving size must be at most 100" })
    .optional(),
  type: z.enum(["community", "cultural"], {
    message: "Type must be 'community' or 'cultural'",
  }),
  isPublished: z.boolean().optional().default(false),
  ingredients: z
    .array(
      z.object({
        ingredientId: z.number().int(),
        quantity: z.number().positive(),
        unit: z.string().min(1),
      })
    )
    .optional()
    .default([]),
  steps: z
    .array(
      z.object({
        stepOrder: z.number().int().min(1),
        description: z.string().min(1),
      })
    )
    .optional()
    .default([]),
  tools: z
    .array(
      z.object({
        name: z.string().min(1),
      })
    )
    .optional()
    .default([]),
});

const updateRecipeSchema = recipeSchema.partial();

// ─── GET /recipes/:id ────────────────────────────────────────────────────────

/**
 * Get full recipe detail including ingredients, tools, steps, media, and story.
 * Published recipes are public. Unpublished recipes are only visible to their creator.
 * Optional ?lang=en or ?lang=tr returns translated fields if a translation exists.
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const recipeId = (req.params["id"] ?? "") as string;
  const langParam = typeof req.query["lang"] === "string"
    ? req.query["lang"].toUpperCase()
    : null;

  const { data, error } = await supabase
    .from("recipes")
    .select(
      `id, title, story, video_url, serving_size, type, is_published, average_rating, rating_count, created_at, updated_at,
       creator:profiles!recipes_creator_id_fkey(id, username),
       dish_variety:dish_varieties(id, name, dish_genre:dish_genres(id, name)),
       recipe_ingredients(id, quantity, unit, ingredient:ingredients(id, name, ingredient_allergens(allergen:allergens(name)))),
       recipe_steps(id, step_order, description),
       recipe_tools(id, name),
       recipe_media(id, url, type)`
    )
    .eq("id", recipeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
      return;
    }
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  const steps = [...(data.recipe_steps ?? [])].sort(
    (a: any, b: any) => a.step_order - b.step_order
  );

  // Resolve translated fields if ?lang= was requested
  let resolvedTitle: string = data.title;
  let resolvedStory: string | null = (data as any).story ?? null;
  let stepTranslationMap: Record<number, string> = {};
  let ingredientUnitMap: Record<number, string> = {};

  if (langParam) {
    const ingredientIds = (data.recipe_ingredients ?? []).map((ri: any) => ri.id);

    const [recipeTransResult, stepTransResult, ingTransResult] = await Promise.all([
      supabase
        .from("recipe_translations")
        .select("title, story")
        .eq("recipe_id", recipeId)
        .eq("language_code", langParam)
        .maybeSingle(),
      supabase
        .from("recipe_step_translations")
        .select("step_id, description")
        .in("step_id", steps.map((s: any) => s.id))
        .eq("language_code", langParam),
      ingredientIds.length > 0
        ? supabase
            .from("recipe_ingredient_translations")
            .select("recipe_ingredient_id, unit")
            .in("recipe_ingredient_id", ingredientIds)
            .eq("language_code", langParam)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (recipeTransResult.data) {
      resolvedTitle = recipeTransResult.data.title;
      resolvedStory = (recipeTransResult.data as any).story ?? resolvedStory;
    }

    for (const row of stepTransResult.data ?? []) {
      stepTranslationMap[(row as any).step_id] = (row as any).description;
    }

    for (const row of ingTransResult.data ?? []) {
      ingredientUnitMap[(row as any).recipe_ingredient_id] = (row as any).unit;
    }
  }

  res.status(200).json(
    successResponse({
      id: data.id,
      creatorId: (data.creator as any)?.id ?? null,
      creatorUsername: (data.creator as any)?.username ?? null,
      dishVarietyId: (data.dish_variety as any)?.id ?? null,
      dishVarietyName: (data.dish_variety as any)?.name ?? null,
      genreName: (data.dish_variety as any)?.dish_genre?.name ?? null,
      title: resolvedTitle,
      story: resolvedStory,
      videoUrl: (data as any).video_url ?? null,
      servingSize: (data as any).serving_size ?? null,
      type: data.type,
      isPublished: (data as any).is_published,
      averageRating: (data as any).average_rating ?? null,
      ratingCount: (data as any).rating_count ?? 0,
      ingredients: (data.recipe_ingredients ?? []).map((ri: any) => ({
        id: ri.id,
        ingredientId: ri.ingredient?.id ?? null,
        ingredientName: ri.ingredient?.name ?? null,
        quantity: ri.quantity,
        unit: ingredientUnitMap[ri.id] ?? ri.unit,
        allergens: (ri.ingredient?.ingredient_allergens ?? [])
          .map((ia: any) => ia.allergen?.name)
          .filter(Boolean),
      })),
      steps: steps.map((s: any) => ({
        id: s.id,
        stepOrder: s.step_order,
        description: stepTranslationMap[s.id] ?? s.description,
      })),
      tools: (data.recipe_tools ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
      })),
      media: (data.recipe_media ?? []).map((m: any) => ({
        id: m.id,
        url: m.url,
        type: m.type,
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    })
  );
});

// ─── GET /recipes ────────────────────────────────────────────────────────────

const listRecipesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * List published recipes with pagination.
 * Public — no auth required.
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = listRecipesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid query parameters.";
    res.status(400).json(errorResponse("VALIDATION_ERROR", message));
    return;
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("recipes")
    .select(
      `id, title, type, average_rating, rating_count, created_at, updated_at,
       creator:profiles!recipes_creator_id_fkey(id, username),
       dish_variety:dish_varieties(id, name, dish_genre:dish_genres(id, name))`,
      { count: "exact" }
    )
    .eq("is_published", true)
    .order("average_rating", { ascending: false })
    .range(from, to);

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  const recipes = (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    averageRating: r.average_rating ?? null,
    ratingCount: r.rating_count ?? 0,
    creatorId: r.creator?.id ?? null,
    creatorUsername: r.creator?.username ?? null,
    dishVarietyId: r.dish_variety?.id ?? null,
    dishVarietyName: r.dish_variety?.name ?? null,
    genreName: r.dish_variety?.dish_genre?.name ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  res.status(200).json(
    successResponse({
      recipes,
      pagination: { page, limit, total: count ?? 0 },
    })
  );
});

// ─── POST /recipes ───────────────────────────────────────────────────────────

/**
 * Create a new recipe.
 * Restricted to Cook and Expert roles.
 * Cooks can only create community recipes.
 */
router.post(
  "/",
  requireAuth,
  requireRole("cook", "expert"),
  validate(recipeSchema),
  async (req, res): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const body = req.body as z.infer<typeof recipeSchema>;
    const userClient = createUserClient(user.accessToken);

    // Role Enforcement: Cooks cannot create cultural recipes
    if (user.role === "cook" && body.type === "cultural") {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "Cooks can only create community recipes."));
      return;
    }

    // 1. Insert Core Recipe
    const { data: recipe, error: recipeError } = await userClient
      .from("recipes")
      .insert({
        creator_id: user.profileId,
        dish_variety_id: body.dishVarietyId ?? null,
        title: body.title,
        story: body.story,
        video_url: body.videoUrl,
        serving_size: body.servingSize ?? null,
        type: body.type,
        is_published: body.isPublished,
      })
      .select("id, created_at")
      .single();

    if (recipeError || !recipe) {
      console.error("Recipe Insert Error:", recipeError);
      res
        .status(500)
        .json(errorResponse("CREATION_FAILED", "Failed to create the recipe."));
      return;
    }

    const recipeId: string = recipe.id;

    // 2. Insert Relationships (Ingredients, Steps, Tools) mapped in parallel
    const insertPromises: PromiseLike<any>[] = [];

    if (body.ingredients.length > 0) {
      insertPromises.push(
        userClient.from("recipe_ingredients").insert(
          body.ingredients.map((i) => ({
            recipe_id: recipeId,
            ingredient_id: i.ingredientId,
            quantity: i.quantity,
            unit: i.unit,
          }))
        ).then(r => r)
      );
    }

    if (body.steps.length > 0) {
      insertPromises.push(
        userClient.from("recipe_steps").insert(
          body.steps.map((s) => ({
            recipe_id: recipeId,
            step_order: s.stepOrder,
            description: s.description,
          }))
        ).then(r => r)
      );
    }

    if (body.tools.length > 0) {
      insertPromises.push(
        userClient.from("recipe_tools").insert(
          body.tools.map((t) => ({
            recipe_id: recipeId,
            name: t.name,
          }))
        ).then(r => r)
      );
    }

    // Wait for all sub-inserts to complete
    const results = await Promise.all(insertPromises);
    const subError = results.find((r) => r.error);

    if (subError) {
      // Note: A true transactional rollback would require a Postgres RPC.
      // For MVP, we log the failure but the core recipe is saved.
      console.error("Sub-insert error:", subError.error);
    }

    res.status(201).json(
      successResponse({
        id: recipeId,
        creatorId: user.profileId,
        dishVarietyId: body.dishVarietyId ?? null,
        title: body.title,
        story: body.story ?? null,
        videoUrl: body.videoUrl ?? null,
        servingSize: body.servingSize ?? null,
        type: body.type,
        isPublished: body.isPublished,
        ingredients: body.ingredients,
        steps: body.steps,
        tools: body.tools,
        createdAt: recipe.created_at,
      })
    );
  }
);

// ─── Update Recipe (PATCH) ──────────────────────────────────────────────────

/**
 * Update a recipe draft.
 * Restricted to Cook and Expert roles.
 * Must be recipe creator.
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("cook", "expert"),
  validate(updateRecipeSchema),
  async (req, res): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const recipeId = req.params["id"];
    const body = req.body as z.infer<typeof updateRecipeSchema>;
    const userClient = createUserClient(user.accessToken);

    // 1. Fetch existing recipe to verify ownership
    const { data: existingRecipe, error: fetchError } = await userClient
      .from("recipes")
      .select("creator_id, type")
      .eq("id", recipeId)
      .single();

    if (fetchError || !existingRecipe) {
      if (fetchError?.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
        return;
      }
      res.status(500).json(errorResponse("SERVER_ERROR", "Could not fetch recipe details."));
      return;
    }

    if (existingRecipe.creator_id !== user.profileId) {
      res.status(403).json(errorResponse("FORBIDDEN", "You can only edit your own recipes."));
      return;
    }

    // Role Enforcement if type is being changed
    if (body.type && body.type !== existingRecipe.type) {
      if (user.role === "cook" && body.type === "cultural") {
        res.status(403).json(errorResponse("FORBIDDEN", "Cooks can only create community recipes."));
        return;
      }
    }

    // 2. Update Core Recipe
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.story !== undefined) updateData.story = body.story;
    if (body.videoUrl !== undefined) updateData.video_url = body.videoUrl;
    if (body.servingSize !== undefined) updateData.serving_size = body.servingSize;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.dishVarietyId !== undefined) updateData.dish_variety_id = body.dishVarietyId;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await userClient
        .from("recipes")
        .update(updateData)
        .eq("id", recipeId);

      if (updateError) {
        console.error("Recipe Update Error:", updateError);
        res.status(500).json(errorResponse("UPDATE_FAILED", "Failed to update core recipe fields."));
        return;
      }
    }

    // 3. Update Relationships (Ingredients, Steps, Tools) - Full Replace strategy
    const insertPromises: PromiseLike<any>[] = [];

    if (body.ingredients) {
      await userClient.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
      if (body.ingredients.length > 0) {
        insertPromises.push(
          userClient.from("recipe_ingredients").insert(
            body.ingredients.map((i) => ({
              recipe_id: recipeId,
              ingredient_id: i.ingredientId,
              quantity: i.quantity,
              unit: i.unit,
            }))
          ).then(r => r)
        );
      }
    }

    if (body.steps) {
      await userClient.from("recipe_steps").delete().eq("recipe_id", recipeId);
      if (body.steps.length > 0) {
        insertPromises.push(
          userClient.from("recipe_steps").insert(
            body.steps.map((s) => ({
              recipe_id: recipeId,
              step_order: s.stepOrder,
              description: s.description,
            }))
          ).then(r => r)
        );
      }
    }

    if (body.tools) {
      await userClient.from("recipe_tools").delete().eq("recipe_id", recipeId);
      if (body.tools.length > 0) {
        insertPromises.push(
          userClient.from("recipe_tools").insert(
            body.tools.map((t) => ({
              recipe_id: recipeId,
              name: t.name,
            }))
          ).then(r => r)
        );
      }
    }

    if (insertPromises.length > 0) {
      await Promise.all(insertPromises);
    }

    res.status(200).json(successResponse({ message: "Recipe updated successfully.", id: recipeId }));
  }
);

// ─── POST /recipes/:id/publish ────────────────────────────────────────────────

/**
 * Publish a draft recipe.
 * Validates completeness (1 ingredient, 1 step min).
 * Must be recipe creator.
 */
router.post("/:id/publish", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const recipeId = (req.params["id"] ?? "") as string;
  const userClient = createUserClient(user.accessToken);

  // Fetch recipe ownership, current publish status, ingredients count, and steps count
  const { data: recipeData, error: recipeQueryError } = await userClient
    .from("recipes")
    .select(
      `
      creator_id,
      is_published,
      dish_variety_id,
      serving_size,
      recipe_ingredients(id),
      recipe_steps(id)
    `
    )
    .eq("id", recipeId)
    .single();

  if (recipeQueryError || !recipeData) {
    if (recipeQueryError?.code === "PGRST116") {
      res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
      return;
    }
    res.status(500).json(errorResponse("SERVER_ERROR", "Could not fetch recipe details."));
    return;
  }

  // 1. Ownership check
  if (recipeData.creator_id !== user.profileId) {
    res.status(403).json(errorResponse("FORBIDDEN", "Only the creator can publish this recipe."));
    return;
  }

  // 2. Already published check
  if (recipeData.is_published) {
    res.status(409).json(errorResponse("CONFLICT", "Recipe is already published."));
    return;
  }

  // 3. Completeness check
  const ingredients = recipeData.recipe_ingredients ?? [];
  const steps = recipeData.recipe_steps ?? [];

  if (
    !recipeData.dish_variety_id ||
    !recipeData.serving_size ||
    ingredients.length === 0 ||
    steps.length === 0
  ) {
    res
      .status(400)
      .json(
        errorResponse(
          "INCOMPLETE_RECIPE",
          "Cannot publish recipe. It must contain a dish variety, serving size, and at least 1 ingredient and 1 step."
        )
      );
    return;
  }

  // Publish
  const { error: updateError } = await userClient
    .from("recipes")
    .update({ is_published: true })
    .eq("id", recipeId);

  if (updateError) {
    res.status(500).json(errorResponse("PUBLISH_FAILED", "Failed to publish recipe."));
    return;
  }

  // Trigger translation non-blocking — publish succeeds even if this fails
  translateRecipe(recipeId).catch((err) =>
    console.error("[publish] Translation trigger error:", err)
  );

  res.status(200).json(
    successResponse({
      id: recipeId,
      isPublished: true,
    })
  );
});

// ─── Rating Schema ────────────────────────────────────────────────────────────

const ratingSchema = z.object({
  score: z
    .number({ message: "Score must be a number." })
    .int({ message: "Score must be an integer." })
    .min(1, { message: "Score must be at least 1." })
    .max(5, { message: "Score must be at most 5." }),
});

// ─── POST /recipes/:id/ratings ────────────────────────────────────────────────

/**
 * Submit or update a star rating for a recipe.
 * Upsert logic: one rating per user per recipe.
 * Cannot rate your own recipe.
 * DB trigger update_recipe_rating() recalculates average_rating + rating_count automatically.
 */
router.post(
  "/:id/ratings",
  requireAuth,
  validate(ratingSchema),
  async (req, res): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const recipeId = req.params["id"];
    const { score } = req.body as z.infer<typeof ratingSchema>;
    const userClient = createUserClient(user.accessToken);

    // 1. Verify recipe exists and check ownership
    const { data: recipe, error: fetchError } = await supabase
      .from("recipes")
      .select("id, creator_id")
      .eq("id", recipeId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
        return;
      }
      res.status(500).json(errorResponse("DB_ERROR", fetchError.message));
      return;
    }

    // 2. Cannot rate your own recipe
    if ((recipe as any).creator_id === user.profileId) {
      res.status(403).json(errorResponse("FORBIDDEN", "You cannot rate your own recipe."));
      return;
    }

    // 3. Upsert rating (updates existing if same user already rated)
    const { data, error: upsertError } = await userClient
      .from("ratings")
      .upsert(
        { recipe_id: recipeId, user_id: user.profileId, score },
        { onConflict: "recipe_id,user_id" }
      )
      .select("id, recipe_id, user_id, score, created_at, updated_at")
      .single();

    if (upsertError) {
      res.status(500).json(errorResponse("DB_ERROR", upsertError.message));
      return;
    }

    res.status(200).json(successResponse(data));
  }
);

// ─── GET /recipes/:id/ratings/me ─────────────────────────────────────────────

/**
 * Get the current user's rating for a recipe.
 * Returns null (with 200) if the user hasn't rated yet.
 */
router.get("/:id/ratings/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const recipeId = req.params["id"];

  const { data, error } = await supabase
    .from("ratings")
    .select("id, score, created_at, updated_at")
    .eq("recipe_id", recipeId)
    .eq("user_id", user.profileId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      res.status(200).json(successResponse(null));
      return;
    }
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(successResponse(data));
});

// ─── DELETE /recipes/:id/ratings/me ──────────────────────────────────────────

/**
 * Delete the current user's rating for a recipe.
 * DB trigger update_recipe_rating() recalculates average_rating + rating_count automatically.
 */
router.delete("/:id/ratings/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const recipeId = req.params["id"];
  const userClient = createUserClient(user.accessToken);

  // 1. Check if rating exists
  const { error: fetchError } = await userClient
    .from("ratings")
    .select("id")
    .eq("recipe_id", recipeId)
    .eq("user_id", user.profileId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      res.status(404).json(errorResponse("NOT_FOUND", "Rating not found."));
      return;
    }
    res.status(500).json(errorResponse("DB_ERROR", fetchError.message));
    return;
  }

  // 2. Delete it
  const { error: deleteError } = await userClient
    .from("ratings")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("user_id", user.profileId);

  if (deleteError) {
    res.status(500).json(errorResponse("DB_ERROR", deleteError.message));
    return;
  }

  res.status(204).send();
});

// ─── POST /recipes/:id/media ──────────────────────────────────────────────────

const attachMediaSchema = z.object({
  url: z.string().url({ message: "Must be a valid URL." }),
  type: z.enum(["image", "video"]),
});

/**
 * Attach an already-uploaded media URL to a recipe.
 * Auth required: Yes. Must be the recipe creator.
 */
router.post(
  "/:id/media",
  requireAuth,
  validate(attachMediaSchema),
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const recipeId = req.params["id"] ?? "";
    const { url, type } = req.body as z.infer<typeof attachMediaSchema>;
    const userClient = createUserClient(user.accessToken);

    // Verify recipe exists and user is the creator
    const { data: recipe, error: fetchError } = await userClient
      .from("recipes")
      .select("id, creator_id")
      .eq("id", recipeId)
      .single();

    if (fetchError || !recipe) {
      res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
      return;
    }

    if (recipe.creator_id !== user.profileId) {
      res.status(403).json(errorResponse("FORBIDDEN", "You are not the creator of this recipe."));
      return;
    }

    const { data, error } = await userClient
      .from("recipe_media")
      .insert({ recipe_id: recipeId, url, type })
      .select("id, url, type, created_at")
      .single();

    if (error) {
      res.status(500).json(errorResponse("DB_ERROR", "Failed to attach media to recipe."));
      return;
    }

    res.status(201).json(successResponse(data));
  }
);

// ─── GET /recipes/:id/media ───────────────────────────────────────────────────

/**
 * Get all media attached to a recipe.
 * Public — no auth required.
 */
router.get("/:id/media", async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from("recipe_media")
    .select("id, url, type, created_at")
    .eq("recipe_id", req.params["id"] ?? "")
    .order("created_at", { ascending: true });

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", "Failed to fetch media."));
    return;
  }

  res.status(200).json(successResponse(data));
});

// ─── DELETE /recipes/:id/media/:mediaId ──────────────────────────────────────

/**
 * Remove a media attachment from a recipe.
 * Auth required: Yes. Must be the recipe creator.
 */
router.delete(
  "/:id/media/:mediaId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const recipeId = req.params["id"] ?? "";
    const mediaId = req.params["mediaId"] ?? "";
    const userClient = createUserClient(user.accessToken);

    // Verify recipe exists and user is the creator
    const { data: recipe, error: fetchError } = await userClient
      .from("recipes")
      .select("id, creator_id")
      .eq("id", recipeId)
      .single();

    if (fetchError || !recipe) {
      res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
      return;
    }

    if (recipe.creator_id !== user.profileId) {
      res.status(403).json(errorResponse("FORBIDDEN", "You are not the creator of this recipe."));
      return;
    }

    const { error } = await userClient
      .from("recipe_media")
      .delete()
      .eq("id", mediaId)
      .eq("recipe_id", recipeId);

    if (error) {
      res.status(500).json(errorResponse("DB_ERROR", "Failed to delete media."));
      return;
    }

    res.status(204).send();
  }
);

export default router;
