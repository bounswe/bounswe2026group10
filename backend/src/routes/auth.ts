import { Router } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest, UserRole } from "../types/index.js";
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
  role: z.enum(["learner", "cook", "expert"], {
    message: "Role must be one of: learner, cook, expert.",
  }),
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
  const { email, password, username, role } = req.body as z.infer<typeof registerSchema>;

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
  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: authData.user.id,
    username,
    role,
  });

  if (profileError) {
    // Profile insertion failed — attempt to clean up the auth user
    await supabase.auth.admin?.deleteUser(authData.user.id).catch(() => null);
    res
      .status(500)
      .json(errorResponse("PROFILE_CREATION_FAILED", "Could not create user profile."));
    return;
  }

  res.status(201).json(
    successResponse({
      userId: authData.user.id,
      email: authData.user.email,
      username,
      role,
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
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

export default router;
