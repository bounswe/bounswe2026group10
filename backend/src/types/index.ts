import type { Request } from "express";

// ─── User Roles ────────────────────────────────────────────────────────────────

export type UserRole = "learner" | "cook" | "expert";

export const USER_ROLES: UserRole[] = ["learner", "cook", "expert"];

// ─── Authenticated User ────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  userId: string;    // auth.users.id
  profileId: string; // profiles.id — used as FK in recipes, ratings, comments, etc.
  email: string;
  username: string;
  role: UserRole;
  accessToken: string;
}

/** Express Request extended with authenticated user info. */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// ─── API Response Envelope ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
