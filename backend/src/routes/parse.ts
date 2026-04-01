import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { parseRecipeText } from "../services/recipe-parser.js";

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

export default router;
