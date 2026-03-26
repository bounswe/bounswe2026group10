import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { errorResponse } from "../utils/response.js";

/**
 * Middleware factory that validates `req.body` against a Zod schema.
 * Returns 400 with a VALIDATION_ERROR on failure.
 */
export const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.map(String).join(".")}: ${issue.message}`)
        .join("; ");
      res.status(400).json(errorResponse("VALIDATION_ERROR", message));
      return;
    }
    req.body = result.data as Record<string, unknown>;
    next();
  };
