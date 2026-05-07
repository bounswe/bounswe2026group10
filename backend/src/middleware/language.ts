import type { Request, Response, NextFunction } from "express";
import type { SupportedLanguage } from "../utils/i18n.js";
import { parseLangParam } from "../utils/i18n.js";

/**
 * Resolves the preferred language from the request and attaches it as `req.lang`.
 *
 * Priority order:
 *   1. `?lang=` query param
 *   2. `Accept-Language` header (first tag only)
 *   3. null — no explicit preference
 *
 * Invalid or unsupported values (neither "en" nor "tr") fall back to "en".
 * When no language source is present, `req.lang` is set to null so downstream
 * handlers can skip translation lookups.
 */
export const detectLanguage = (req: Request, _res: Response, next: NextFunction): void => {
  // ?lang= query param takes priority
  if (req.query["lang"] !== undefined) {
    const parsed = parseLangParam(req.query["lang"]);
    (req as any).lang = (parsed === "en" || parsed === "tr") ? parsed : ("en" as SupportedLanguage);
    return next();
  }

  // Fall back to Accept-Language header
  const acceptLang = req.headers["accept-language"];
  if (acceptLang) {
    const primary = acceptLang.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
    (req as any).lang = primary.startsWith("tr") ? ("tr" as SupportedLanguage) : ("en" as SupportedLanguage);
    return next();
  }

  // No explicit language preference expressed
  (req as any).lang = null;
  next();
};
