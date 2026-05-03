export type SupportedLanguage = "en" | "tr";

/**
 * Parses the ?lang= query parameter.
 * Returns null if absent, "invalid" if the value is not "en" or "tr".
 */
export function parseLangParam(raw: unknown): SupportedLanguage | "invalid" | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") return "invalid";
  const lower = raw.toLowerCase();
  if (lower === "en" || lower === "tr") return lower as SupportedLanguage;
  return "invalid";
}

/**
 * Resolves the preferred-language value, falling back to the other language
 * when the requested one is null/undefined.
 */
export function resolveLang(
  en: string | null | undefined,
  tr: string | null | undefined,
  lang: SupportedLanguage
): string | null {
  if (lang === "en") return en ?? tr ?? null;
  return tr ?? en ?? null;
}
