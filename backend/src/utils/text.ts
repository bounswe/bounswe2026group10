/**
 * Turkish-aware text helpers (issue #402, parent #384).
 *
 * Two distinct problems are addressed here:
 *
 *   1. **Storage encoding** — Mobile keyboards and some browsers can emit
 *      decomposed Unicode (e.g. `c` + U+0327 combining cedilla) where others
 *      emit precomposed (`ç`, U+00E7). Equality, indexes, and ILIKE all see
 *      these as different. `normalizeText()` collapses inputs to NFC on the
 *      write path so future rows are stable.
 *
 *   2. **Case-insensitive search in Turkish locale** — Postgres ILIKE folds
 *      via the database's lc_ctype, which on most non-Turkish setups maps
 *      `İ` (U+0130) to `i̇` (i + combining dot above) rather than plain `i`.
 *      That breaks `'İstanbul' ILIKE '%istanbul%'`. Mirror-side, `ı` and `i`
 *      are different code points and never match each other regardless of
 *      collation.
 *
 *      `buildSearchVariants()` expands a user's search input into a small
 *      deduped set of ILIKE patterns (raw, Turkish-locale-lowercased, ASCII
 *      lowercased, fully folded) so a single OR-of-ilikes covers the common
 *      mismatches. `turkishFold()` returns the same fully-folded form for
 *      JS-side comparison (e.g. dedupe, post-filter).
 */

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Normalize free-text input for storage: NFC, collapse internal whitespace,
 * trim. Preserves Turkish characters (ğ ü ş ı ö ç İ etc.) — only collapses
 * encoding ambiguity. Returns null for empty/whitespace-only input.
 */
export function normalizeText(
  input: string | null | undefined
): string | null {
  if (input == null) return null;
  const collapsed = input.normalize("NFC").replace(/\s+/g, " ").trim();
  return collapsed.length === 0 ? null : collapsed;
}

/**
 * Turkish-aware case-insensitive comparison key. Use when comparing strings
 * in JS (dedupe, post-filter, equality checks). Two strings that differ only
 * in case, encoding (NFC vs NFD), Turkish dotted-i pairing (i/İ vs ı/I), or
 * other Latin diacritics will share the same fold.
 *
 * Steps:
 *   1. NFC normalize.
 *   2. Pair Turkish dotted-i (İ → I, ı → i) so step 4's lowercase is safe.
 *   3. NFD + strip combining marks (folds ü → u, ş → s, ğ → g, ç → c, ö → o).
 *   4. Lowercase + collapse whitespace + trim.
 */
export function turkishFold(input: string): string {
  return input
    .normalize("NFC")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Expand a search input into a deduped list of variants suitable for an
 * OR-of-ilikes query. Each variant is the raw search string transformed in
 * a way that may match rows the others miss:
 *
 *   - the input as typed (NFC) — handles exact-case rows
 *   - Turkish-locale lowercased (`I` → `ı`, `İ` → `i`)
 *   - default-locale lowercased (`I` → `i`) for en-style data
 *   - fully folded (Turkish dotted-i paired + diacritics stripped) for rows
 *     stored without accents
 *
 * Callers wrap each variant with `%…%` and pass to `.ilike()` / `.or()`.
 * Empty/whitespace-only input returns `[]`.
 */
export function buildSearchVariants(input: string): string[] {
  const normalized = input.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const variants = new Set<string>();
  variants.add(normalized);
  variants.add(normalized.toLocaleLowerCase("tr-TR"));
  variants.add(normalized.toLocaleLowerCase("en-US"));
  variants.add(turkishFold(normalized));

  return [...variants].filter((v) => v.length > 0);
}
