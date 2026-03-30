import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /dietary-tags ───────────────────────────────────────────────────────
// Returns all supported dietary and allergen tags.

router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("dietary_tags")
    .select("id, name, category")
    .order("category")
    .order("name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  return res.status(200).json(successResponse(data));
});

export default router;
