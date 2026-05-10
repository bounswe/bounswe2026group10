import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest, UserRole } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";

const router = Router();

// All routes in this file are admin-only.
router.use(requireAuth, requireAdmin);

/**
 * Returns the privileged service-role Supabase client, or sends a 503 to the
 * caller and returns null when the key is not configured. Reads from
 * `profiles` (e.g. listing users) work through the regular `supabase` anon
 * client because the SELECT policy is `USING: true`; writes to other users'
 * rows do NOT, because the RLS UPDATE policy on profiles is restricted to
 * `(user_id = auth.uid())`. So we use this helper only for cross-row writes.
 */
function getAdminClient(res: Response): typeof supabaseAdmin {
  if (!supabaseAdmin) {
    res
      .status(503)
      .json(
        errorResponse(
          "ADMIN_NOT_CONFIGURED",
          "SUPABASE_SERVICE_ROLE_KEY is not set on the backend; admin writes are disabled."
        )
      );
    return null;
  }
  return supabaseAdmin;
}

// ─── Expert Requests ─────────────────────────────────────────────────────────

const listExpertRequestsQuery = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /admin/expert-requests
 * List expert account requests, newest first. Default: only pending.
 */
router.get("/expert-requests", async (req: Request, res: Response): Promise<void> => {
  const parsed = listExpertRequestsQuery.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json(errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query."));
    return;
  }
  const { status, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("expert_requests")
    .select(
      `id, user_id, reason, status, decision_note, decided_by, created_at, decided_at,
       applicant:profiles!expert_requests_user_id_fkey(id, username, role)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.eq("status", "pending");
  }

  const { data, error, count } = await query;
  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  const items = (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    reason: r.reason,
    status: r.status,
    decisionNote: r.decision_note,
    decidedBy: r.decided_by,
    createdAt: r.created_at,
    decidedAt: r.decided_at,
    applicant: r.applicant
      ? { id: r.applicant.id, username: r.applicant.username, role: r.applicant.role }
      : null,
  }));

  res.status(200).json(
    successResponse({
      requests: items,
      pagination: { page, limit, total: count ?? 0 },
    })
  );
});

const decisionSchema = z.object({
  decisionNote: z
    .string()
    .trim()
    .max(2000, "Decision note must be at most 2000 characters.")
    .optional(),
});

/**
 * Loads a request by id and ensures it is in 'pending' state. Returns the
 * row, or sends an error response and returns null.
 */
async function loadPendingRequest(
  id: string,
  res: Response
): Promise<{ id: string; user_id: string } | null> {
  const { data: request, error } = await supabase
    .from("expert_requests")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return null;
  }
  if (!request) {
    res.status(404).json(errorResponse("NOT_FOUND", "Expert request not found."));
    return null;
  }
  if ((request as any).status !== "pending") {
    res
      .status(409)
      .json(
        errorResponse(
          "REQUEST_ALREADY_DECIDED",
          `This request has already been ${(request as any).status}.`
        )
      );
    return null;
  }
  return request as { id: string; user_id: string };
}

/**
 * POST /admin/expert-requests/:id/approve
 * Promotes the applicant to "expert" and marks the request approved.
 */
router.post(
  "/expert-requests/:id/approve",
  validate(decisionSchema),
  async (req: Request, res: Response): Promise<void> => {
    const admin = (req as AuthenticatedRequest).user;
    const id = req.params["id"] as string;
    const { decisionNote } = req.body as z.infer<typeof decisionSchema>;

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    const request = await loadPendingRequest(id, res);
    if (!request) return;

    // 1) Promote the applicant first. We do this before flipping the request
    //    state so that a failure here leaves the request as 'pending' and the
    //    admin can simply retry. Verifying with `.select().single()` makes a
    //    silent 0-row update (e.g. RLS misconfig) surface as an error instead
    //    of pretending the promotion succeeded.
    const decidedAt = new Date().toISOString();
    const { data: promoted, error: roleErr } = await adminClient
      .from("profiles")
      .update({ role: "expert", updated_at: decidedAt })
      .eq("id", request.user_id)
      .neq("role", "admin")
      .select("id, role")
      .maybeSingle();

    if (roleErr) {
      res.status(500).json(errorResponse("DB_ERROR", roleErr.message));
      return;
    }
    if (!promoted) {
      // Either the profile vanished, or it was already an admin — both should
      // be treated as a hard error here so the admin sees what happened.
      res
        .status(409)
        .json(
          errorResponse(
            "PROMOTION_FAILED",
            "Could not promote the applicant. Their profile may have been deleted or already be an admin."
          )
        );
      return;
    }

    // 2) Mark the request approved using the same admin client (RLS isn't
    //    set on expert_requests today, but using the privileged client keeps
    //    the contract uniform if policies are added later).
    const { error: updateErr } = await adminClient
      .from("expert_requests")
      .update({
        status: "approved",
        decision_note: decisionNote ?? null,
        decided_by: admin.profileId,
        decided_at: decidedAt,
      })
      .eq("id", request.id);

    if (updateErr) {
      res.status(500).json(errorResponse("DB_ERROR", updateErr.message));
      return;
    }

    res.status(200).json(
      successResponse({
        id: request.id,
        userId: request.user_id,
        status: "approved",
        decisionNote: decisionNote ?? null,
        decidedAt,
      })
    );
  }
);

/**
 * POST /admin/expert-requests/:id/reject
 * Marks the request rejected. Profile role is unchanged.
 */
router.post(
  "/expert-requests/:id/reject",
  validate(decisionSchema),
  async (req: Request, res: Response): Promise<void> => {
    const admin = (req as AuthenticatedRequest).user;
    const id = req.params["id"] as string;
    const { decisionNote } = req.body as z.infer<typeof decisionSchema>;

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    const request = await loadPendingRequest(id, res);
    if (!request) return;

    const decidedAt = new Date().toISOString();
    const { error } = await adminClient
      .from("expert_requests")
      .update({
        status: "rejected",
        decision_note: decisionNote ?? null,
        decided_by: admin.profileId,
        decided_at: decidedAt,
      })
      .eq("id", request.id);

    if (error) {
      res.status(500).json(errorResponse("DB_ERROR", error.message));
      return;
    }

    res.status(200).json(
      successResponse({
        id: request.id,
        userId: request.user_id,
        status: "rejected",
        decisionNote: decisionNote ?? null,
        decidedAt,
      })
    );
  }
);

// ─── Users ───────────────────────────────────────────────────────────────────

const listUsersQuery = z.object({
  search: z.string().trim().min(1).optional(),
  role: z.enum(["learner", "cook", "expert", "admin"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /admin/users
 * List profiles with optional username search and role filter.
 */
router.get("/users", async (req: Request, res: Response): Promise<void> => {
  const parsed = listUsersQuery.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json(errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query."));
    return;
  }
  const { search, role, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("profiles")
    .select(
      "id, user_id, username, role, region, preferred_language, bio, avatar_url, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("username", `%${search}%`);
  }
  if (role) {
    query = query.eq("role", role);
  }

  const { data, error, count } = await query;
  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(
    successResponse({
      users: data ?? [],
      pagination: { page, limit, total: count ?? 0 },
    })
  );
});

const updateUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.")
    .optional(),
  role: z.enum(["learner", "cook", "expert"]).optional(),
  bio: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  preferred_language: z.string().max(10).optional(),
});

/**
 * PATCH /admin/users/:id
 * Update another user's profile. Role can be changed to any non-admin value;
 * promoting/demoting the admin is intentionally not supported here (the
 * single-admin invariant is enforced by a partial unique index in the DB).
 */
router.patch(
  "/users/:id",
  validate(updateUserSchema),
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;
    const updates = req.body as z.infer<typeof updateUserSchema>;

    if (Object.keys(updates).length === 0) {
      res
        .status(400)
        .json(errorResponse("VALIDATION_ERROR", "At least one field must be provided."));
      return;
    }

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    // Refuse to mutate the admin profile via this endpoint.
    const { data: target, error: loadErr } = await supabase
      .from("profiles")
      .select("id, role, username")
      .eq("id", id)
      .maybeSingle();

    if (loadErr) {
      res.status(500).json(errorResponse("DB_ERROR", loadErr.message));
      return;
    }
    if (!target) {
      res.status(404).json(errorResponse("NOT_FOUND", "User not found."));
      return;
    }
    if ((target as any).role === "admin") {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "The admin profile cannot be modified via this endpoint."));
      return;
    }

    if (updates.username && updates.username !== (target as any).username) {
      const { data: clash } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", updates.username)
        .maybeSingle();
      if (clash) {
        res.status(409).json(errorResponse("CONFLICT", "Username is already taken."));
        return;
      }
    }

    const { data: updated, error } = await adminClient
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(
        "id, user_id, username, role, region, preferred_language, bio, avatar_url, created_at, updated_at"
      )
      .single();

    if (error) {
      res.status(500).json(errorResponse("DB_ERROR", error.message));
      return;
    }

    res.status(200).json(successResponse(updated));
  }
);

/**
 * DELETE /admin/users/:id
 * Removes the profile row. All recipes/comments/ratings/etc. cascade away
 * via the existing FKs. The matching auth.users row remains (it can only be
 * removed via the Supabase service role); the deleted profile is enough to
 * lock the account out of every API endpoint.
 */
router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const admin = (req as AuthenticatedRequest).user;
  const id = req.params["id"] as string;

  if (id === admin.profileId) {
    res
      .status(403)
      .json(errorResponse("FORBIDDEN", "You cannot delete your own admin profile."));
    return;
  }

  const adminClient = getAdminClient(res);
  if (!adminClient) return;

  const { data: target, error: loadErr } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) {
    res.status(500).json(errorResponse("DB_ERROR", loadErr.message));
    return;
  }
  if (!target) {
    res.status(404).json(errorResponse("NOT_FOUND", "User not found."));
    return;
  }
  if ((target as any).role === "admin") {
    res
      .status(403)
      .json(errorResponse("FORBIDDEN", "The admin profile cannot be deleted via this endpoint."));
    return;
  }

  const { error } = await adminClient.from("profiles").delete().eq("id", id);
  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(204).send();
});

// ─── Recipes ─────────────────────────────────────────────────────────────────

/**
 * DELETE /admin/recipes/:id
 * Removes a recipe regardless of who created it. All recipe_* child rows,
 * ratings, comments, video_annotations, etc. cascade away via FKs.
 */
router.delete("/recipes/:id", async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const adminClient = getAdminClient(res);
  if (!adminClient) return;

  const { data: recipe, error: loadErr } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) {
    res.status(500).json(errorResponse("DB_ERROR", loadErr.message));
    return;
  }
  if (!recipe) {
    res.status(404).json(errorResponse("NOT_FOUND", "Recipe not found."));
    return;
  }

  const { error } = await adminClient.from("recipes").delete().eq("id", id);
  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(204).send();
});

// ─── Comments ────────────────────────────────────────────────────────────────

/**
 * DELETE /admin/comments/:id
 * Moderator-style deletion: removes any comment, even if the admin is not its
 * author. Distinct from `DELETE /comments/:id` which is author-only.
 */
router.delete("/comments/:id", async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    res.status(400).json(errorResponse("VALIDATION_ERROR", "Comment id must be an integer."));
    return;
  }

  const adminClient = getAdminClient(res);
  if (!adminClient) return;

  const { data: existing, error: loadErr } = await supabase
    .from("comments")
    .select("id")
    .eq("id", idNum)
    .maybeSingle();

  if (loadErr) {
    res.status(500).json(errorResponse("DB_ERROR", loadErr.message));
    return;
  }
  if (!existing) {
    res.status(404).json(errorResponse("NOT_FOUND", "Comment not found."));
    return;
  }

  const { error } = await adminClient.from("comments").delete().eq("id", idNum);
  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(204).send();
});

// ─── Cultural Tag Requests ────────────────────────────────────────────────────

const listCulturalTagRequestsQuery = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const approveTagRequestSchema = z.object({
  labelEn:      z.string().trim().min(2).max(100).optional(),
  labelTr:      z.string().trim().min(2).max(100).optional(),
  country:      z.string().trim().min(1).max(100).optional(),
  decisionNote: z.string().trim().max(2000).optional(),
});

function slugifyTagKey(text: string): string {
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

/**
 * GET /admin/cultural-tag-requests
 * List cultural tag requests. Defaults to pending only.
 */
router.get("/cultural-tag-requests", async (req: Request, res: Response): Promise<void> => {
  const parsed = listCulturalTagRequestsQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json(errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query."));
    return;
  }
  const { status, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("cultural_tag_requests")
    .select(
      `id, label_en, label_tr, country, status, decision_note, decided_by, created_at, decided_at,
       requester:profiles!cultural_tag_requests_requested_by_fkey(id, username)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  query = status ? query.eq("status", status) : query.eq("status", "pending");

  const { data, error, count } = await query;
  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(successResponse({
    requests: (data ?? []).map((r: any) => ({
      id:           r.id,
      labelEn:      r.label_en,
      labelTr:      r.label_tr,
      country:      r.country ?? null,
      status:       r.status,
      decisionNote: r.decision_note ?? null,
      decidedBy:    r.decided_by ?? null,
      createdAt:    r.created_at,
      decidedAt:    r.decided_at ?? null,
      requester:    r.requester ? { id: r.requester.id, username: r.requester.username } : null,
    })),
    pagination: { page, limit, total: count ?? 0 },
  }));
});

/**
 * POST /admin/cultural-tag-requests/:id/approve
 * Approves the request and inserts the tag into cultural_tags.
 * Admin can override labelEn, labelTr, or country before approving.
 * label_en is required (either from the original request or admin override)
 * because it is used to generate the unique key.
 */
router.post(
  "/cultural-tag-requests/:id/approve",
  validate(approveTagRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const admin = (req as AuthenticatedRequest).user;
    const id = req.params["id"] as string;
    const idNum = Number.parseInt(id, 10);
    if (!Number.isFinite(idNum)) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "Request id must be an integer."));
      return;
    }

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    const { labelEn, labelTr, country, decisionNote } = req.body as z.infer<typeof approveTagRequestSchema>;

    // 1. Load the request
    const { data: tagRequest, error: loadErr } = await supabase
      .from("cultural_tag_requests")
      .select("id, label_en, label_tr, country, status")
      .eq("id", idNum)
      .maybeSingle();

    if (loadErr) { res.status(500).json(errorResponse("DB_ERROR", loadErr.message)); return; }
    if (!tagRequest) { res.status(404).json(errorResponse("NOT_FOUND", "Cultural tag request not found.")); return; }
    if ((tagRequest as any).status !== "pending") {
      res.status(409).json(errorResponse("REQUEST_ALREADY_DECIDED", `This request has already been ${(tagRequest as any).status}.`));
      return;
    }

    // 2. Resolve final labels (admin override wins)
    const finalLabelEn = labelEn ?? (tagRequest as any).label_en;
    const finalLabelTr = labelTr ?? (tagRequest as any).label_tr;
    const finalCountry = country !== undefined ? country : ((tagRequest as any).country ?? null);

    if (!finalLabelEn) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "labelEn is required to generate the tag key. Provide it in the request body."));
      return;
    }

    // 3. Generate key and check uniqueness
    const key = slugifyTagKey(finalLabelEn);
    const { data: existing } = await supabase
      .from("cultural_tags")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    if (existing) {
      res.status(409).json(errorResponse("CONFLICT", `A cultural tag with key '${key}' already exists.`));
      return;
    }

    // 4. Insert into cultural_tags
    const { data: newTag, error: insertErr } = await adminClient
      .from("cultural_tags")
      .insert({ key, label_en: finalLabelEn, label_tr: finalLabelTr, country: finalCountry })
      .select("id, key, label_en, label_tr, country")
      .single();

    if (insertErr) { res.status(500).json(errorResponse("DB_ERROR", insertErr.message)); return; }

    // 5. Mark request approved
    const decidedAt = new Date().toISOString();
    const { error: updateErr } = await adminClient
      .from("cultural_tag_requests")
      .update({ status: "approved", decision_note: decisionNote ?? null, decided_by: admin.profileId, decided_at: decidedAt })
      .eq("id", idNum);

    if (updateErr) { res.status(500).json(errorResponse("DB_ERROR", updateErr.message)); return; }

    res.status(200).json(successResponse({
      requestId:  idNum,
      status:     "approved",
      createdTag: {
        id:      (newTag as any).id,
        key:     (newTag as any).key,
        labelEn: (newTag as any).label_en,
        labelTr: (newTag as any).label_tr,
        country: (newTag as any).country ?? null,
      },
      decisionNote: decisionNote ?? null,
      decidedAt,
    }));
  }
);

/**
 * POST /admin/cultural-tag-requests/:id/reject
 * Rejects the request. No tag is created.
 */
router.post(
  "/cultural-tag-requests/:id/reject",
  validate(decisionSchema),
  async (req: Request, res: Response): Promise<void> => {
    const admin = (req as AuthenticatedRequest).user;
    const id = req.params["id"] as string;
    const idNum = Number.parseInt(id, 10);
    if (!Number.isFinite(idNum)) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "Request id must be an integer."));
      return;
    }

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    const { decisionNote } = req.body as z.infer<typeof decisionSchema>;

    const { data: tagRequest, error: loadErr } = await supabase
      .from("cultural_tag_requests")
      .select("id, status")
      .eq("id", idNum)
      .maybeSingle();

    if (loadErr) { res.status(500).json(errorResponse("DB_ERROR", loadErr.message)); return; }
    if (!tagRequest) { res.status(404).json(errorResponse("NOT_FOUND", "Cultural tag request not found.")); return; }
    if ((tagRequest as any).status !== "pending") {
      res.status(409).json(errorResponse("REQUEST_ALREADY_DECIDED", `This request has already been ${(tagRequest as any).status}.`));
      return;
    }

    const decidedAt = new Date().toISOString();
    const { error } = await adminClient
      .from("cultural_tag_requests")
      .update({ status: "rejected", decision_note: decisionNote ?? null, decided_by: admin.profileId, decided_at: decidedAt })
      .eq("id", idNum);

    if (error) { res.status(500).json(errorResponse("DB_ERROR", error.message)); return; }

    res.status(200).json(successResponse({ requestId: idNum, status: "rejected", decisionNote: decisionNote ?? null, decidedAt }));
  }
);

// ─── Dish Genre Requests ──────────────────────────────────────────────────────

const listContentRequestsQuery = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const approveGenreRequestSchema = z.object({
  nameEn:        z.string().trim().min(2).max(200).optional(),
  nameTr:        z.string().trim().min(2).max(200).optional(),
  descriptionEn: z.string().trim().max(2000).optional(),
  descriptionTr: z.string().trim().max(2000).optional(),
  decisionNote:  z.string().trim().max(2000).optional(),
});

/**
 * GET /admin/dish-genre-requests
 * List dish genre requests. Defaults to pending only.
 */
router.get("/dish-genre-requests", async (req: Request, res: Response): Promise<void> => {
  const parsed = listContentRequestsQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json(errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query."));
    return;
  }
  const { status, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("dish_genre_requests")
    .select(
      `id, name_en, name_tr, description_en, description_tr, status, decision_note, decided_by, created_at, decided_at,
       requester:profiles!dish_genre_requests_requested_by_fkey(id, username)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  query = status ? query.eq("status", status) : query.eq("status", "pending");

  const { data, error, count } = await query;
  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(successResponse({
    requests: (data ?? []).map((r: any) => ({
      id:            r.id,
      nameEn:        r.name_en,
      nameTr:        r.name_tr,
      descriptionEn: r.description_en ?? null,
      descriptionTr: r.description_tr ?? null,
      status:        r.status,
      decisionNote:  r.decision_note ?? null,
      decidedBy:     r.decided_by ?? null,
      createdAt:     r.created_at,
      decidedAt:     r.decided_at ?? null,
      requester:     r.requester ? { id: r.requester.id, username: r.requester.username } : null,
    })),
    pagination: { page, limit, total: count ?? 0 },
  }));
});

/**
 * POST /admin/dish-genre-requests/:id/approve
 * Approves the request and inserts the genre into dish_genres.
 * nameEn is required (either from the original request or admin override).
 */
router.post(
  "/dish-genre-requests/:id/approve",
  validate(approveGenreRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const admin = (req as AuthenticatedRequest).user;
    const idNum = Number.parseInt(req.params["id"] as string, 10);
    if (!Number.isFinite(idNum)) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "Request id must be an integer."));
      return;
    }

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    const { nameEn, nameTr, descriptionEn, descriptionTr, decisionNote } = req.body as z.infer<typeof approveGenreRequestSchema>;

    // 1. Load the request
    const { data: genreRequest, error: loadErr } = await supabase
      .from("dish_genre_requests")
      .select("id, name_en, name_tr, description_en, description_tr, status")
      .eq("id", idNum)
      .maybeSingle();

    if (loadErr) { res.status(500).json(errorResponse("DB_ERROR", loadErr.message)); return; }
    if (!genreRequest) { res.status(404).json(errorResponse("NOT_FOUND", "Dish genre request not found.")); return; }
    if ((genreRequest as any).status !== "pending") {
      res.status(409).json(errorResponse("REQUEST_ALREADY_DECIDED", `This request has already been ${(genreRequest as any).status}.`));
      return;
    }

    // 2. Resolve final values (admin override wins)
    const finalNameEn = nameEn ?? (genreRequest as any).name_en;
    const finalNameTr = nameTr ?? (genreRequest as any).name_tr ?? null;
    const finalDescEn = descriptionEn ?? (genreRequest as any).description_en ?? null;
    const finalDescTr = descriptionTr ?? (genreRequest as any).description_tr ?? null;

    if (!finalNameEn) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "nameEn is required to create the genre. Provide it in the request body."));
      return;
    }

    // 3. Insert into dish_genres
    const { data: newGenre, error: insertErr } = await adminClient
      .from("dish_genres")
      .insert({
        name:           finalNameEn,
        name_en:        finalNameEn,
        name_tr:        finalNameTr,
        description:    finalDescEn ?? finalDescTr ?? null,
        description_en: finalDescEn,
        description_tr: finalDescTr,
      })
      .select("id, name, name_en, name_tr, description_en, description_tr")
      .single();

    if (insertErr) { res.status(500).json(errorResponse("DB_ERROR", insertErr.message)); return; }

    // 4. Mark request approved
    const decidedAt = new Date().toISOString();
    const { error: updateErr } = await adminClient
      .from("dish_genre_requests")
      .update({ status: "approved", decision_note: decisionNote ?? null, decided_by: admin.profileId, decided_at: decidedAt })
      .eq("id", idNum);

    if (updateErr) { res.status(500).json(errorResponse("DB_ERROR", updateErr.message)); return; }

    res.status(200).json(successResponse({
      requestId:    idNum,
      status:       "approved",
      createdGenre: {
        id:            (newGenre as any).id,
        nameEn:        (newGenre as any).name_en,
        nameTr:        (newGenre as any).name_tr,
        descriptionEn: (newGenre as any).description_en ?? null,
        descriptionTr: (newGenre as any).description_tr ?? null,
      },
      decisionNote: decisionNote ?? null,
      decidedAt,
    }));
  }
);

/**
 * POST /admin/dish-genre-requests/:id/reject
 * Rejects the request. No genre is created.
 */
router.post(
  "/dish-genre-requests/:id/reject",
  validate(decisionSchema),
  async (req: Request, res: Response): Promise<void> => {
    const admin = (req as AuthenticatedRequest).user;
    const idNum = Number.parseInt(req.params["id"] as string, 10);
    if (!Number.isFinite(idNum)) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "Request id must be an integer."));
      return;
    }

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    const { decisionNote } = req.body as z.infer<typeof decisionSchema>;

    const { data: genreRequest, error: loadErr } = await supabase
      .from("dish_genre_requests")
      .select("id, status")
      .eq("id", idNum)
      .maybeSingle();

    if (loadErr) { res.status(500).json(errorResponse("DB_ERROR", loadErr.message)); return; }
    if (!genreRequest) { res.status(404).json(errorResponse("NOT_FOUND", "Dish genre request not found.")); return; }
    if ((genreRequest as any).status !== "pending") {
      res.status(409).json(errorResponse("REQUEST_ALREADY_DECIDED", `This request has already been ${(genreRequest as any).status}.`));
      return;
    }

    const decidedAt = new Date().toISOString();
    const { error } = await adminClient
      .from("dish_genre_requests")
      .update({ status: "rejected", decision_note: decisionNote ?? null, decided_by: admin.profileId, decided_at: decidedAt })
      .eq("id", idNum);

    if (error) { res.status(500).json(errorResponse("DB_ERROR", error.message)); return; }

    res.status(200).json(successResponse({ requestId: idNum, status: "rejected", decisionNote: decisionNote ?? null, decidedAt }));
  }
);

// ─── Dish Variety Requests ────────────────────────────────────────────────────

const approveVarietyRequestSchema = z.object({
  nameEn:        z.string().trim().min(2).max(200).optional(),
  nameTr:        z.string().trim().min(2).max(200).optional(),
  descriptionEn: z.string().trim().max(2000).optional(),
  descriptionTr: z.string().trim().max(2000).optional(),
  genreId:       z.number().int().positive().optional(),
  decisionNote:  z.string().trim().max(2000).optional(),
});

/**
 * GET /admin/dish-variety-requests
 * List dish variety requests. Defaults to pending only.
 */
router.get("/dish-variety-requests", async (req: Request, res: Response): Promise<void> => {
  const parsed = listContentRequestsQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json(errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query."));
    return;
  }
  const { status, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("dish_variety_requests")
    .select(
      `id, genre_id, name_en, name_tr, description_en, description_tr, status, decision_note, decided_by, created_at, decided_at,
       requester:profiles!dish_variety_requests_requested_by_fkey(id, username)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  query = status ? query.eq("status", status) : query.eq("status", "pending");

  const { data, error, count } = await query;
  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(successResponse({
    requests: (data ?? []).map((r: any) => ({
      id:            r.id,
      genreId:       r.genre_id,
      nameEn:        r.name_en,
      nameTr:        r.name_tr,
      descriptionEn: r.description_en ?? null,
      descriptionTr: r.description_tr ?? null,
      status:        r.status,
      decisionNote:  r.decision_note ?? null,
      decidedBy:     r.decided_by ?? null,
      createdAt:     r.created_at,
      decidedAt:     r.decided_at ?? null,
      requester:     r.requester ? { id: r.requester.id, username: r.requester.username } : null,
    })),
    pagination: { page, limit, total: count ?? 0 },
  }));
});

/**
 * POST /admin/dish-variety-requests/:id/approve
 * Approves the request and inserts the variety into dish_varieties.
 * nameEn is required.
 */
router.post(
  "/dish-variety-requests/:id/approve",
  validate(approveVarietyRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const admin = (req as AuthenticatedRequest).user;
    const idNum = Number.parseInt(req.params["id"] as string, 10);
    if (!Number.isFinite(idNum)) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "Request id must be an integer."));
      return;
    }

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    const { nameEn, nameTr, descriptionEn, descriptionTr, genreId, decisionNote } = req.body as z.infer<typeof approveVarietyRequestSchema>;

    // 1. Load the request
    const { data: varietyRequest, error: loadErr } = await supabase
      .from("dish_variety_requests")
      .select("id, genre_id, name_en, name_tr, description_en, description_tr, status")
      .eq("id", idNum)
      .maybeSingle();

    if (loadErr) { res.status(500).json(errorResponse("DB_ERROR", loadErr.message)); return; }
    if (!varietyRequest) { res.status(404).json(errorResponse("NOT_FOUND", "Dish variety request not found.")); return; }
    if ((varietyRequest as any).status !== "pending") {
      res.status(409).json(errorResponse("REQUEST_ALREADY_DECIDED", `This request has already been ${(varietyRequest as any).status}.`));
      return;
    }

    // 2. Resolve final values (admin override wins)
    const finalNameEn = nameEn ?? (varietyRequest as any).name_en;
    const finalNameTr = nameTr ?? (varietyRequest as any).name_tr ?? null;
    const finalDescEn = descriptionEn ?? (varietyRequest as any).description_en ?? null;
    const finalDescTr = descriptionTr ?? (varietyRequest as any).description_tr ?? null;
    const finalGenreId = genreId ?? (varietyRequest as any).genre_id;

    if (!finalNameEn) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "nameEn is required to create the variety. Provide it in the request body."));
      return;
    }

    // 3. Insert into dish_varieties
    const { data: newVariety, error: insertErr } = await adminClient
      .from("dish_varieties")
      .insert({
        name:           finalNameEn,
        name_en:        finalNameEn,
        name_tr:        finalNameTr,
        description:    finalDescEn ?? finalDescTr ?? null,
        description_en: finalDescEn,
        description_tr: finalDescTr,
        genre_id:       finalGenreId,
      })
      .select("id, name, name_en, name_tr, description_en, description_tr, genre_id")
      .single();

    if (insertErr) { res.status(500).json(errorResponse("DB_ERROR", insertErr.message)); return; }

    // 4. Mark request approved
    const decidedAt = new Date().toISOString();
    const { error: updateErr } = await adminClient
      .from("dish_variety_requests")
      .update({ status: "approved", decision_note: decisionNote ?? null, decided_by: admin.profileId, decided_at: decidedAt })
      .eq("id", idNum);

    if (updateErr) { res.status(500).json(errorResponse("DB_ERROR", updateErr.message)); return; }

    res.status(200).json(successResponse({
      requestId:      idNum,
      status:         "approved",
      createdVariety: {
        id:            (newVariety as any).id,
        genreId:       (newVariety as any).genre_id,
        nameEn:        (newVariety as any).name_en,
        nameTr:        (newVariety as any).name_tr,
        descriptionEn: (newVariety as any).description_en ?? null,
        descriptionTr: (newVariety as any).description_tr ?? null,
      },
      decisionNote: decisionNote ?? null,
      decidedAt,
    }));
  }
);

/**
 * POST /admin/dish-variety-requests/:id/reject
 * Rejects the request. No variety is created.
 */
router.post(
  "/dish-variety-requests/:id/reject",
  validate(decisionSchema),
  async (req: Request, res: Response): Promise<void> => {
    const admin = (req as AuthenticatedRequest).user;
    const idNum = Number.parseInt(req.params["id"] as string, 10);
    if (!Number.isFinite(idNum)) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "Request id must be an integer."));
      return;
    }

    const adminClient = getAdminClient(res);
    if (!adminClient) return;

    const { decisionNote } = req.body as z.infer<typeof decisionSchema>;

    const { data: varietyRequest, error: loadErr } = await supabase
      .from("dish_variety_requests")
      .select("id, status")
      .eq("id", idNum)
      .maybeSingle();

    if (loadErr) { res.status(500).json(errorResponse("DB_ERROR", loadErr.message)); return; }
    if (!varietyRequest) { res.status(404).json(errorResponse("NOT_FOUND", "Dish variety request not found.")); return; }
    if ((varietyRequest as any).status !== "pending") {
      res.status(409).json(errorResponse("REQUEST_ALREADY_DECIDED", `This request has already been ${(varietyRequest as any).status}.`));
      return;
    }

    const decidedAt = new Date().toISOString();
    const { error } = await adminClient
      .from("dish_variety_requests")
      .update({ status: "rejected", decision_note: decisionNote ?? null, decided_by: admin.profileId, decided_at: decidedAt })
      .eq("id", idNum);

    if (error) { res.status(500).json(errorResponse("DB_ERROR", error.message)); return; }

    res.status(200).json(successResponse({ requestId: idNum, status: "rejected", decisionNote: decisionNote ?? null, decidedAt }));
  }
);

// Lint hint: silence unused-import warnings in environments where UserRole is
// shaken out by the bundler.
export type _Unused = UserRole;

export default router;
