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

// Lint hint: silence unused-import warnings in environments where UserRole is
// shaken out by the bundler.
export type _Unused = UserRole;

export default router;
