import { Router } from "express";
import { z } from "zod";
import { supabase, createUserClient } from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { successResponse, errorResponse } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// ─── GET /ingredients ───────────────────────────────────────────────────────
// Search ingredients by partial name match (case-insensitive).
// Query params:
//   search — partial ingredient name (optional)

router.get("/", async (req, res) => {
  const search = (req.query["search"] as string | undefined)?.trim();

  let query = supabase.from("ingredients").select("id, name");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query.order("name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  return res.status(200).json(successResponse(data));
});

// ─── POST /ingredients ──────────────────────────────────────────────────────

const createIngredientSchema = z.object({
  name: z.string({ message: "Name is required." }).trim().min(1, { message: "Name cannot be empty." }),
});

/**
 * Create a new ingredient.
 * Restricted to cook and expert roles.
 * Returns 409 if an ingredient with the same name already exists (case-insensitive).
 */
router.post(
  "/",
  requireAuth,
  requireRole("cook", "expert"),
  validate(createIngredientSchema),
  async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const { name } = req.body as z.infer<typeof createIngredientSchema>;
    const userClient = createUserClient(user.accessToken);

    const { data: existing } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (existing) {
      return res.status(409).json(errorResponse("CONFLICT", "An ingredient with this name already exists."));
    }

    const { data, error } = await userClient
      .from("ingredients")
      .insert({ name: name.toLowerCase() })
      .select("id, name")
      .single();

    if (error) {
      return res.status(500).json(errorResponse("DB_ERROR", error.message));
    }

    return res.status(201).json(successResponse(data));
  }
);

export default router;
