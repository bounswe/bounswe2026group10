/**
 * Helpers for handling recipe location labels (country, city, district).
 *
 * Recipes are tagged with free-text region labels supplied by users. Two kinds
 * of mismatches break the origin filter (issue #398):
 *
 *   1. Casing / whitespace — "Turkey" vs " turkey ".
 *   2. Aliases / translations / diacritics — "Turkey" vs "tr" vs "Türkiye"
 *      vs "TUR".
 *
 * The first is solved with normalizeLocation + ilike. The second needs an
 * alias table (so "tr" and "Türkiye" both resolve to "Turkey") plus a
 * folding function that ignores diacritics and Turkish dotted-i so the
 * lookup is robust to user typing.
 *
 * Reads expand the input into every known surface form and OR them together;
 * writes resolve the input to the canonical display name, so future rows
 * are clean regardless of which form the user typed.
 */

// ─── Public API ──────────────────────────────────────────────────────────────

export function normalizeLocation(
  input: string | null | undefined
): string | null {
  if (input == null) return null;
  const collapsed = input.replace(/\s+/g, " ").trim();
  return collapsed.length === 0 ? null : collapsed;
}

export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Resolve a location label to its canonical display name when the input
 * matches a known alias (e.g. "tr"/"Türkiye"/"TUR" → "Turkey"). Inputs
 * that don't match any alias are returned trimmed/whitespace-collapsed.
 * Returns null for empty/whitespace-only input.
 *
 * Used on the write path (POST/PATCH /recipes) so future rows store a
 * single canonical form regardless of how the user typed it.
 */
export function canonicalizeLocationForWrite(
  input: string | null | undefined
): string | null {
  const trimmed = normalizeLocation(input);
  if (trimmed == null) return null;
  return getCanonicalDisplay(foldLocation(trimmed)) ?? trimmed;
}

/**
 * Return every surface form known to be equivalent to the input, suitable
 * for an OR-of-ilikes query. For inputs not in the alias table, returns
 * the trimmed input alone.
 *
 * Used on the read path so a filter for "tr" still matches legacy rows
 * stored as "Turkey", "Türkiye", or "TR".
 */
export function getLocationVariants(input: string): string[] {
  const trimmed = normalizeLocation(input);
  if (trimmed == null) return [];
  const folded = foldLocation(trimmed);
  const canonical = getCanonicalDisplay(folded);
  if (!canonical) return [trimmed];

  const variants = new Set<string>([canonical]);
  for (const [aliasKey, displayName] of Object.entries(LOCATION_ALIASES)) {
    if (displayName === canonical) variants.add(aliasKey);
  }
  return [...variants];
}

/**
 * Deduplicate a list of location labels, treating values that share a
 * canonical key (after folding + alias resolution) as the same entry.
 * The canonical display name wins when present; otherwise the first-seen
 * raw form is kept. Result is sorted alphabetically.
 */
export function dedupeLocationLabels(values: unknown[]): string[] {
  const seen = new Map<string, string>();
  for (const v of values) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    const folded = foldLocation(trimmed);
    const canonical = getCanonicalDisplay(folded);
    const key = canonical ? foldLocation(canonical) : folded;
    if (!seen.has(key)) seen.set(key, canonical ?? trimmed);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

// ─── Internals ───────────────────────────────────────────────────────────────

/**
 * Fold a label into a comparison key: handle Turkish dotted-i (İ/ı), strip
 * combining diacritical marks via NFD, lowercase, and collapse whitespace.
 * "Türkiye", "TÜRKİYE", " turkiye " all fold to "turkiye".
 */
function foldLocation(input: string): string {
  return input
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getCanonicalDisplay(folded: string): string | null {
  return LOCATION_ALIASES[folded] ?? null;
}

/**
 * Folded alias → canonical display name. Add a country here when users in
 * the wild type it multiple ways (translations, ISO-2/ISO-3, common
 * abbreviations). The canonical form is whatever we want to show in the
 * UI / store on write.
 */
const LOCATION_ALIASES: Record<string, string> = {
  // Turkey
  "turkey": "Turkey",
  "turkiye": "Turkey",
  "tr": "Turkey",
  "tur": "Turkey",
  "republic of turkey": "Turkey",
  "republic of turkiye": "Turkey",

  // United States
  "united states": "United States",
  "united states of america": "United States",
  "us": "United States",
  "usa": "United States",
  "america": "United States",

  // United Kingdom
  "united kingdom": "United Kingdom",
  "uk": "United Kingdom",
  "gb": "United Kingdom",
  "gbr": "United Kingdom",
  "great britain": "United Kingdom",
  "britain": "United Kingdom",

  // Germany
  "germany": "Germany",
  "deutschland": "Germany",
  "de": "Germany",
  "deu": "Germany",
  "ger": "Germany",

  // Italy
  "italy": "Italy",
  "italia": "Italy",
  "it": "Italy",
  "ita": "Italy",

  // France
  "france": "France",
  "fr": "France",
  "fra": "France",

  // Spain
  "spain": "Spain",
  "espana": "Spain",
  "es": "Spain",
  "esp": "Spain",

  // Japan
  "japan": "Japan",
  "nihon": "Japan",
  "nippon": "Japan",
  "jp": "Japan",
  "jpn": "Japan",

  // Greece
  "greece": "Greece",
  "ellada": "Greece",
  "hellas": "Greece",
  "gr": "Greece",
  "grc": "Greece",

  // Azerbaijan
  "azerbaijan": "Azerbaijan",
  "azerbaycan": "Azerbaijan",
  "az": "Azerbaijan",
  "aze": "Azerbaijan",
};
