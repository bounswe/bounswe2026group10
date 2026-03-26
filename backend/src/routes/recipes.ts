import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import { errorResponse } from "../utils/response.js";

const router = Router();

/**
 * POST /recipes — Create a new recipe.
 * Restricted to Cook and Expert roles.
 * Learners will receive 403 Forbidden.
 *
 * This is a stub route that demonstrates RBAC enforcement (Issue #150 Done Criteria).
 * Full recipe implementation will be done in a subsequent issue.
 */
router.post(
  "/",
  requireAuth,
  requireRole("cook", "expert"),
  (_req, res): void => {
    // Stub — full implementation in the recipes feature issue
    res.status(501).json(
      errorResponse("NOT_IMPLEMENTED", "Recipe creation is not yet implemented.")
    );
  }
);

export default router;
