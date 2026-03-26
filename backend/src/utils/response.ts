import type { ApiError, ApiSuccess } from "../types/index.js";

/**
 * Constructs a successful API response envelope.
 */
export const successResponse = <T>(data: T): ApiSuccess<T> => ({
  success: true,
  data,
  error: null,
});

/**
 * Constructs a standardised API error response envelope.
 * @param code  Machine-readable error code (e.g. "VALIDATION_ERROR")
 * @param message  Human-readable description
 */
export const errorResponse = (code: string, message: string): ApiError => ({
  success: false,
  data: null,
  error: { code, message },
});
