// Normalizes a string for case-insensitive search across both Turkish and English.
// Turkish locale rules: İ→i (dotted), I→ı (dotless). After applying tr-TR lowercase,
// we also replace ı→i so that "Istanbul" (plain I) and "İstanbul" (dotted İ) both
// normalize to "istanbul" and match the same query.
function foldForSearch(s: string): string {
  return s.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i');
}

export function searchStartsWith(text: string, query: string): boolean {
  return foldForSearch(text).startsWith(foldForSearch(query));
}

export function searchIncludes(text: string, query: string): boolean {
  return foldForSearch(text).includes(foldForSearch(query));
}

export function searchEquals(a: string, b: string): boolean {
  return foldForSearch(a) === foldForSearch(b);
}
