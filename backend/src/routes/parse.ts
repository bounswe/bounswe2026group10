import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { parseRecipeText, standardizeUnits } from "../services/recipe-parser.js";

const router = Router();

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const parseRecipeTextSchema = z.object({
  text: z
    .string({ message: "Text is required." })
    .min(10, { message: "Text must be at least 10 characters." })
    .max(5000, { message: "Text must be at most 5000 characters." }),
});

// ─── POST /parse/recipe-text ─────────────────────────────────────────────────

/**
 * Parse a free-text recipe narrative into structured components.
 * Returns structured ingredients, steps, and tools without storing anything.
 *
 * Auth required: Yes (cook or expert).
 */
router.post(
  "/recipe-text",
  requireAuth,
  requireRole("cook", "expert"),
  validate(parseRecipeTextSchema),
  async (req, res: Response): Promise<void> => {
    const { text } = req.body as z.infer<typeof parseRecipeTextSchema>;

    try {
      const parsed = await parseRecipeText(text);

      res.status(200).json(
        successResponse({
          title: parsed.title,
          ingredients: parsed.ingredients,
          steps: parsed.steps,
          tools: parsed.tools,
        })
      );
    } catch (err: any) {
      console.error("Recipe parse error:", err);
      res
        .status(500)
        .json(errorResponse("PARSE_FAILED", "Failed to parse recipe text. Please try again."));
    }
  }
);

// ─── Zod Schema — Standardize Units ─────────────────────────────────────────

const standardizeUnitsSchema = z.object({
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().min(1),
      })
    )
    .min(1, { message: "At least one ingredient is required." })
    .max(50, { message: "Maximum 50 ingredients allowed." }),
  steps: z
    .array(
      z.object({
        stepOrder: z.number().int().positive(),
        description: z.string().min(1),
      })
    )
    .max(50)
    .optional(),
  region: z.string().optional(),
});

// ─── POST /parse/standardize-units ──────────────────────────────────────────

/**
 * Convert informal/colloquial ingredient units and step descriptions
 * to standard measurements and clear instructions.
 * Accepts structured ingredients and optional steps (from parsing or manual entry).
 *
 * Auth required: Yes (cook or expert).
 */
router.post(
  "/standardize-units",
  requireAuth,
  requireRole("cook", "expert"),
  validate(standardizeUnitsSchema),
  async (req, res: Response): Promise<void> => {
    const { ingredients, steps, region } = req.body as z.infer<typeof standardizeUnitsSchema>;

    try {
      const standardized = await standardizeUnits(ingredients, steps, region);

      res.status(200).json(successResponse(standardized));
    } catch (err: any) {
      console.error("Standardization error:", err);
      res
        .status(500)
        .json(
          errorResponse(
            "STANDARDIZATION_FAILED",
            "Failed to standardize recipe. Please try again."
          )
        );
    }
  }
);

export default router;
