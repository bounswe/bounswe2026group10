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

/**
 * Picks the preferred `name_en` / `name_tr` field off an object that may also
 * carry a legacy `name` column. Used to resolve dish-variety and dish-genre
 * names on recipe listings when ?lang= is set. Returns `obj.name` (or null)
 * when `langParam` is null — i.e. no language preference expressed.
 */
export function resolveLocalizedName(
  obj: { name?: string | null; name_en?: string | null; name_tr?: string | null } | null | undefined,
  langParam: "EN" | "TR" | null
): string | null {
  if (!obj) return null;
  if (!langParam) return obj.name ?? null;
  const preferred = langParam === "EN" ? obj.name_en : obj.name_tr;
  const fallback = langParam === "EN" ? obj.name_tr : obj.name_en;
  return preferred ?? fallback ?? obj.name ?? null;
}
