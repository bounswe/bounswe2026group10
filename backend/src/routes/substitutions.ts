import { Router, type Request, type Response } from "express";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = Router();

// ─── GET /ingredients/:id/substitutions ──────────────────────────────────────
// Returns substitute suggestions for a given ingredient.
// Query params:
//   amount — requested quantity of the original ingredient (optional, positive number)
//   unit   — unit of the requested quantity, e.g. "gr" (optional)
//
// If amount + unit are provided, the returned sub_amount is calculated:
//   sub_amount = (amount / source_amount) × base_sub_amount
//
// Example: 1 gr salt → 2 ml lemon. Request ?amount=4&unit=gr → returns 8 ml lemon.
// Scaling is applied on top of the substituted amount by the caller.

router.get("/:id/substitutions", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt((req.params["id"] ?? "") as string, 10);

  if (isNaN(id)) {
    res.status(400).json(errorResponse("VALIDATION_ERROR", "Invalid ingredient ID."));
    return;
  }

  const amountParam = req.query["amount"] as string | undefined;
  const unit = (req.query["unit"] as string | undefined)?.trim();

  let requestedAmount: number | null = null;
  if (amountParam !== undefined) {
    requestedAmount = parseFloat(amountParam);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "amount must be a positive number."));
      return;
    }
  }

  // ── Verify ingredient exists ───────────────────────────────────────────────
  const { data: ingredient, error: ingError } = await supabase
    .from("ingredients")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (ingError) {
    res.status(500).json(errorResponse("DB_ERROR", ingError.message));
    return;
  }

  if (!ingredient) {
    res.status(404).json(errorResponse("NOT_FOUND", "Ingredient not found."));
    return;
  }

  // ── Fetch substitutions ────────────────────────────────────────────────────
  let query = supabase
    .from("ingredient_substitutions")
    .select("source_amount, source_unit, sub_amount, sub_unit, confidence, description, substitute:ingredients!substitute_id(id, name)")
    .eq("ingredient_id", id);

  if (unit) {
    query = query.eq("source_unit", unit);
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json(errorResponse("DB_ERROR", error.message));
    return;
  }

  const substitutes = (data ?? []).map((row: any) => {
    const calculatedAmount =
      requestedAmount !== null
        ? Math.round((requestedAmount / row.source_amount) * row.sub_amount * 1000) / 1000
        : row.sub_amount;

    return {
      ingredient: row.substitute,   // { id, name } — what to use instead
      amount: calculatedAmount,      // how much of it to use
      unit: row.sub_unit,            // in what unit
      confidence: row.confidence,    // 0–1 reliability score
      description: row.description,  // human-readable usage note
    };
  });

  res.status(200).json(successResponse(substitutes));
});

export default router;
