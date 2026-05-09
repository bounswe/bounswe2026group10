import type { Request } from "express";
import type { SupportedLanguage } from "../utils/i18n.js";

// ─── Language ─────────────────────────────────────────────────────────────────

export type { SupportedLanguage } from "../utils/i18n.js";

/** Express Request extended with the resolved language preference (set by detectLanguage middleware). */
export interface LanguageRequest extends Request {
  lang: SupportedLanguage | null;
}

// ─── User Roles ────────────────────────────────────────────────────────────────

export type UserRole = "learner" | "cook" | "expert" | "admin";

export const USER_ROLES: UserRole[] = ["learner", "cook", "expert", "admin"];

/** Roles selectable at registration. `admin` is intentionally excluded. */
export const REGISTRABLE_ROLES = ["learner", "cook", "expert"] as const;
export type RegistrableRole = (typeof REGISTRABLE_ROLES)[number];

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
