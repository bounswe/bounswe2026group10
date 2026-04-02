import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /tools ──────────────────────────────────────────────────────────────
// Search tools by partial name match (case-insensitive).
// Query params:
//   search — partial tool name (optional)
// Returns distinct tool names from recipe_tools.

router.get("/", async (req, res) => {
  const search = (req.query["search"] as string | undefined)?.trim();

  let query = supabase.from("recipe_tools").select("name");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query.order("name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  const seen = new Set<string>();
  const unique = (data ?? []).filter((tool) => {
    if (seen.has(tool.name)) return false;
    seen.add(tool.name);
    return true;
  });

  return res.status(200).json(successResponse(unique));
});

export default router;
