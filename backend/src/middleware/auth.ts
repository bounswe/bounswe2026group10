import type { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase.js";
import type { UserRole, AuthenticatedRequest } from "../types/index.js";
import { errorResponse } from "../utils/response.js";

// ─── requireAuth ──────────────────────────────────────────────────────────────

/**
 * Middleware that validates the Bearer JWT from the Authorization header.
 * On success it attaches `req.user` and calls `next()`.
 * Returns 401 for missing/invalid tokens, 403 if the profile row is not found.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json(errorResponse("UNAUTHORIZED", "Missing or malformed Authorization header."));
    return;
  }

  const token = authHeader.slice(7);

  // Validate JWT with Supabase
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData.user) {
    res.status(401).json(errorResponse("UNAUTHORIZED", "Invalid or expired token."));
    return;
  }

  // Fetch profile for role information
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, role")
    .eq("user_id", userData.user.id)
    .single();

  if (profileError || !profile) {
    res
      .status(403)
      .json(errorResponse("FORBIDDEN", "User profile not found. Please complete registration."));
    return;
  }

  (req as AuthenticatedRequest).user = {
    userId: userData.user.id,
    profileId: profile.id as string,
    email: userData.user.email ?? "",
    username: profile.username as string,
    role: profile.role as UserRole,
    accessToken: token,
  };

  next();
};

// ─── requireRole ─────────────────────────────────────────────────────────────

/**
 * Middleware factory that restricts access to the given roles.
 * Must be used AFTER `requireAuth`.
 *
 * @example
 *   router.post("/recipes", requireAuth, requireRole("cook", "expert"), handler)
 */
export const requireRole =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res
        .status(403)
        .json(
          errorResponse(
            "FORBIDDEN",
            `This action requires one of the following roles: ${allowedRoles.join(", ")}.`
          )
        );
      return;
    }
    next();
  };
