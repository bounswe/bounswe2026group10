import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest, UserRole } from "../types/index.js";
import { REGISTRABLE_ROLES } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";

const router = Router();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Must be a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be at most 30 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  role: z.enum(REGISTRABLE_ROLES, {
    message: "Role must be one of: learner, cook, expert.",
  }),
  // Optional justification — used only when `role === "expert"` to seed the
  // expert_requests row that a single admin will later review/approve.
  expertRequestReason: z
    .string()
    .trim()
    .max(2000, "Expert request reason must be at most 2000 characters.")
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});

// ─── POST /auth/register ─────────────────────────────────────────────────────

/**
 * Register a new user.
 * Creates a Supabase Auth user and a corresponding profile row.
 */
router.post("/register", validate(registerSchema), async (req, res): Promise<void> => {
  const {
    email,
    password,
    username,
    role: requestedRole,
    expertRequestReason,
  } = req.body as z.infer<typeof registerSchema>;

  // Option-A expert flow: choosing "expert" at registration does NOT make the
  // user an expert. The profile is created with role="cook" (so the applicant
  // can already publish community recipes while waiting) and a pending
  // expert_requests row is opened. The single admin reviews it, and if
  // approved, the user's role is promoted to "expert".
  const isExpertRequest = requestedRole === "expert";
  const role: UserRole = isExpertRequest ? "cook" : requestedRole;

  // Check if username already taken (before creating auth user)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingProfile) {
    res.status(409).json(errorResponse("CONFLICT", "Username is already taken."));
    return;
  }

  // Create Supabase Auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    // Detect duplicate email from Supabase error messages
    if (
      signUpError.message.toLowerCase().includes("already") ||
      signUpError.message.toLowerCase().includes("taken") ||
      signUpError.message.toLowerCase().includes("registered")
    ) {
      res.status(409).json(errorResponse("CONFLICT", "Email is already registered."));
      return;
    }
    res.status(400).json(errorResponse("REGISTRATION_FAILED", signUpError.message));
    return;
  }

  if (!authData.user || !authData.session) {
    res
      .status(400)
      .json(
        errorResponse(
          "REGISTRATION_FAILED",
          "Registration failed. Please check your email and password."
        )
      );
    return;
  }

  // Insert profile row
  const { data: insertedProfile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      user_id: authData.user.id,
      username,
      role,
    })
    .select("id")
    .single();

  if (profileError || !insertedProfile) {
    // Profile insertion failed — attempt to clean up the auth user
    await supabase.auth.admin?.deleteUser(authData.user.id).catch(() => null);
    res
      .status(500)
      .json(errorResponse("PROFILE_CREATION_FAILED", "Could not create user profile."));
    return;
  }

  // If the caller asked for the "expert" role, open a pending expert_requests
  // row tied to their fresh profile. Failure here is non-fatal — the account
  // is created either way; the user can re-submit via POST /auth/expert-requests.
  let pendingExpertRequest = false;
  if (isExpertRequest) {
    const { error: reqError } = await supabase.from("expert_requests").insert({
      user_id: (insertedProfile as { id: string }).id,
      reason: expertRequestReason ?? null,
      status: "pending",
    });
    if (!reqError) {
      pendingExpertRequest = true;
    }
  }

  res.status(201).json(
    successResponse({
      userId: authData.user.id,
      email: authData.user.email,
      username,
      role,
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      pendingExpertRequest,
    })
  );
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

/**
 * Login with email and password.
 */
router.post("/login", validate(loginSchema), async (req, res): Promise<void> => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    res.status(401).json(errorResponse("INVALID_CREDENTIALS", "Invalid email or password."));
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("user_id", data.user.id)
    .single();

  if (profileError || !profile) {
    res.status(403).json(errorResponse("FORBIDDEN", "User profile not found."));
    return;
  }

  res.status(200).json(
    successResponse({
      userId: data.user.id,
      email: data.user.email,
      username: profile.username,
      role: profile.role,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    })
  );
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

/**
 * Logout and invalidate the current session.
 * Requires a valid Bearer token.
 */
router.post("/logout", requireAuth, async (_req, res): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    res.status(500).json(errorResponse("LOGOUT_FAILED", "Could not sign out. Please try again."));
    return;
  }
  res.status(204).send();
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

/**
 * Refresh an expired access token using a refresh token.
 */
router.post("/refresh", validate(refreshSchema), async (req, res): Promise<void> => {
  const { refreshToken } = req.body as z.infer<typeof refreshSchema>;

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    res
      .status(401)
      .json(errorResponse("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired."));
    return;
  }

  res.status(200).json(
    successResponse({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    })
  );
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

/**
 * Returns the current authenticated user's basic info.
 */
router.get("/me", requireAuth, (req, res): void => {
  const user = (req as AuthenticatedRequest).user;
  res.status(200).json(
    successResponse({
      userId: user.userId,
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
      createdAt: new Date().toISOString(), // profile creation date would require another DB call
    })
  );
});

// ─── PATCH /auth/profile ──────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be at most 30 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.")
    .optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters.").optional(),
  avatar_url: z.string().url("avatar_url must be a valid URL.").optional(),
  preferred_language: z.string().max(10).optional(),
  region: z.string().max(100).optional(),
});

/**
 * Update the current authenticated user's profile fields.
 * All fields are optional — only provided fields are updated.
 */
router.patch("/profile", requireAuth, validate(updateProfileSchema), async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const updates = req.body as z.infer<typeof updateProfileSchema>;

  if (Object.keys(updates).length === 0) {
    res.status(400).json(errorResponse("VALIDATION_ERROR", "At least one field must be provided."));
    return;
  }

  // Check username uniqueness if being changed
  if (updates.username && updates.username !== user.username) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", updates.username)
      .maybeSingle();

    if (existing) {
      res.status(409).json(errorResponse("CONFLICT", "Username is already taken."));
      return;
    }
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.profileId)
    .select("id, username, bio, avatar_url, preferred_language, region, updated_at")
    .single();

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  res.status(200).json(successResponse(updated));
});

// ─── Expert Account Requests ─────────────────────────────────────────────────
//
// Open-to-self endpoints used by learner/cook profiles to apply for promotion
// to "expert". The matching admin-side review endpoints live under
// `/admin/expert-requests/*` (see src/routes/admin.ts).

const expertRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Please provide a short reason for your request.")
    .max(2000, "Reason must be at most 2000 characters."),
});

/**
 * Submit an expert-account request. The caller must currently be a learner or
 * cook (already-experts and the admin cannot apply). Only one pending request
 * per user is allowed; a previously rejected request does not block a new one.
 */
router.post(
  "/expert-requests",
  requireAuth,
  validate(expertRequestSchema),
  async (req, res): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const { reason } = req.body as z.infer<typeof expertRequestSchema>;

    if (user.role === "expert") {
      res
        .status(409)
        .json(errorResponse("CONFLICT", "You are already an expert."));
      return;
    }
    if (user.role === "admin") {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "Admins cannot request the expert role."));
      return;
    }

    // Reject if a pending request already exists.
    const { data: existing } = await supabase
      .from("expert_requests")
      .select("id, status")
      .eq("user_id", user.profileId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      res
        .status(409)
        .json(
          errorResponse(
            "EXPERT_REQUEST_PENDING",
            "You already have a pending expert request."
          )
        );
      return;
    }

    const { data: inserted, error } = await supabase
      .from("expert_requests")
      .insert({
        user_id: user.profileId,
        reason,
        status: "pending",
      })
      .select("id, user_id, reason, status, created_at")
      .single();

    if (error || !inserted) {
      // Map the partial-unique-index race to the same 409 path.
      if ((error as { code?: string } | null)?.code === "23505") {
        res
          .status(409)
          .json(
            errorResponse(
              "EXPERT_REQUEST_PENDING",
              "You already have a pending expert request."
            )
          );
        return;
      }
      res.status(500).json(errorResponse("DB_ERROR", error?.message ?? "Insert failed."));
      return;
    }

    res.status(201).json(
      successResponse({
        id: (inserted as any).id,
        userId: (inserted as any).user_id,
        reason: (inserted as any).reason,
        status: (inserted as any).status,
        createdAt: (inserted as any).created_at,
      })
    );
  }
);

/**
 * Returns the most recent expert request belonging to the caller, or null if
 * none exists. Useful for the frontend to render "your request is pending /
 * approved / rejected" badges.
 */
router.get("/expert-requests/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;

  const { data, error } = await supabase
    .from("expert_requests")
    .select("id, user_id, reason, status, decision_note, decided_by, created_at, decided_at")
    .eq("user_id", user.profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  if (!data) {
    res.status(200).json(successResponse(null));
    return;
  }

  res.status(200).json(
    successResponse({
      id: (data as any).id,
      userId: (data as any).user_id,
      reason: (data as any).reason,
      status: (data as any).status,
      decisionNote: (data as any).decision_note,
      decidedBy: (data as any).decided_by,
      createdAt: (data as any).created_at,
      decidedAt: (data as any).decided_at,
    })
  );
});

export default router;
