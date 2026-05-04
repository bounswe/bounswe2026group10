import {
  normalizeText,
  turkishFold,
  buildSearchVariants,
} from "../utils/text.js";

// Issue #402 — backend must handle Turkish characters correctly in storage
// and search. These tests cover the three pain points called out in the
// parent issue (#384): rendering, search, and stored text fidelity.

describe("normalizeText", () => {
  it("returns null for null/undefined/whitespace-only", () => {
    expect(normalizeText(null)).toBeNull();
    expect(normalizeText(undefined)).toBeNull();
    expect(normalizeText("")).toBeNull();
    expect(normalizeText("   ")).toBeNull();
    expect(normalizeText("\t\n  ")).toBeNull();
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeText("  Köfte  ")).toBe("Köfte");
    expect(normalizeText("Adana   Kebap")).toBe("Adana Kebap");
    expect(normalizeText("\tBörek\n")).toBe("Börek");
  });

  it("preserves Turkish characters intact", () => {
    expect(normalizeText("Çorba ğüşı İstanbul")).toBe("Çorba ğüşı İstanbul");
    expect(normalizeText("ÖĞÜŞIİ")).toBe("ÖĞÜŞIİ");
  });

  it("collapses NFD decomposed input to NFC", () => {
    // "Çorba" composed (U+00C7) vs decomposed (C + combining cedilla U+0327)
    const decomposed = "Çorba";
    const composed = "Çorba";
    expect(normalizeText(decomposed)).toBe(composed);
    // Both inputs collapse to the same canonical form.
    expect(normalizeText(decomposed)).toBe(normalizeText(composed));
  });
});

describe("turkishFold", () => {
  it("equates dotted-i case pairs (Turkish locale)", () => {
    expect(turkishFold("İstanbul")).toBe(turkishFold("istanbul"));
    expect(turkishFold("ISPARTA")).toBe(turkishFold("ısparta"));
    expect(turkishFold("İZMİR")).toBe(turkishFold("izmir"));
  });

  it("strips diacritics so accented and unaccented forms collide", () => {
    expect(turkishFold("Köfte")).toBe(turkishFold("kofte"));
    expect(turkishFold("Çorba")).toBe(turkishFold("corba"));
    expect(turkishFold("Şiş")).toBe(turkishFold("sis"));
    expect(turkishFold("Börek")).toBe(turkishFold("borek"));
    expect(turkishFold("Ğ ü ş ı ö ç")).toBe(turkishFold("g u s i o c"));
  });

  it("handles NFC and NFD encodings the same way", () => {
    const nfc = "ç";
    const nfd = "ç";
    expect(turkishFold(nfc)).toBe(turkishFold(nfd));
  });

  it("returns a stable lowercase key without leading/trailing whitespace", () => {
    expect(turkishFold("  Mantı  ")).toBe("manti");
    expect(turkishFold("Adana   Kebap")).toBe("adana kebap");
  });

  it("differentiates strings that should not collide", () => {
    expect(turkishFold("kebap")).not.toBe(turkishFold("kepab"));
    expect(turkishFold("istanbul")).not.toBe(turkishFold("istanbula"));
  });
});

describe("buildSearchVariants", () => {
  it("returns an empty list for empty/whitespace input", () => {
    expect(buildSearchVariants("")).toEqual([]);
    expect(buildSearchVariants("   ")).toEqual([]);
  });

  it("includes the original NFC-normalized input", () => {
    expect(buildSearchVariants("Köfte")).toContain("Köfte");
  });

  it("includes Turkish-locale lowercase for I/İ pairs", () => {
    // Turkish locale: I → ı, default locale: I → i. Both should appear so
    // a search for ASCII "ISTANBUL" hits rows stored as either "İstanbul"
    // or "Istanbul".
    const variants = buildSearchVariants("ISTANBUL");
    expect(variants).toContain("ıstanbul");
    expect(variants).toContain("istanbul");
  });

  it("Turkish capital İ lowercases to plain 'i' in Turkish locale", () => {
    const variants = buildSearchVariants("İSTANBUL");
    // tr-TR maps İ → i (no combining dot), unlike the en-US default.
    expect(variants).toContain("istanbul");
  });

  it("includes a fully folded ASCII variant", () => {
    const variants = buildSearchVariants("Köfte");
    expect(variants).toContain("kofte");
  });

  it("dedupes when variants happen to coincide", () => {
    // For pure ASCII input, several folds produce the same string.
    const variants = buildSearchVariants("salt");
    expect(new Set(variants).size).toBe(variants.length);
    expect(variants).toContain("salt");
  });

  it("covers a Turkish dish name with multiple ambiguous chars", () => {
    const variants = buildSearchVariants("İmam Bayıldı");
    expect(variants).toContain("imam bayildi");
    // The Turkish-locale lowercase keeps dotted-i pairing intact.
    expect(variants.some((v) => v.includes("imam") && v.includes("bayıldı"))).toBe(true);
  });
});

// Sanity check that the helpers compose correctly for the Done Criteria
// scenarios in #402.
describe("end-to-end: Turkish search edge cases", () => {
  it("'istanbul' search would match 'İstanbul' rows via OR-of-ilikes variants", () => {
    const variants = buildSearchVariants("istanbul");
    // At least one variant Turkish-folds to the same key as the stored value.
    const storedFold = turkishFold("İstanbul");
    expect(variants.some((v) => turkishFold(v) === storedFold)).toBe(true);
  });

  it("'kofte' search would match 'Köfte' rows via the folded variant", () => {
    const variants = buildSearchVariants("kofte");
    const storedFold = turkishFold("Köfte");
    expect(variants.some((v) => turkishFold(v) === storedFold)).toBe(true);
  });

  it("storing 'Çorba' from a decomposed-input client preserves the precomposed form", () => {
    const decomposedInput = "Çorba";
    const stored = normalizeText(decomposedInput);
    expect(stored).toBe("Çorba");
    expect(stored).toHaveLength(5); // 5 code points (NFC)
  });
});
