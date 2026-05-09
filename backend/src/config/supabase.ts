import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];
const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables."
  );
}

/**
 * Default Supabase client (uses anon key).
 * For user-authenticated requests, use createUserClient(token).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Creates a Supabase client scoped to a specific user's JWT token.
 * Used in authenticated routes to validate tokens.
 */
export const createUserClient = (accessToken: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

/**
 * Privileged Supabase client used only by `/admin/*` routes for cross-profile
 * writes. Uses the service-role key, which bypasses RLS — anything done through
 * this client is unconstrained by row-level policies, so callers MUST gate
 * access with `requireAdmin` first.
 *
 * `null` when SUPABASE_SERVICE_ROLE_KEY is not configured. Admin routes detect
 * this and return a clear error instead of silently no-op'ing under RLS.
 */
export const supabaseAdmin: SupabaseClient | null = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (!supabaseAdmin && process.env["NODE_ENV"] !== "test") {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] SUPABASE_SERVICE_ROLE_KEY is not set. /admin/* writes will fail with ADMIN_NOT_CONFIGURED until it is provided."
  );
}
