import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /ingredients ───────────────────────────────────────────────────────
// Search ingredients by partial name match (case-insensitive).
// Query params:
//   search — partial ingredient name (required, min 1 char)
//   limit  — max results (default 10, max 50)

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

export default router;
