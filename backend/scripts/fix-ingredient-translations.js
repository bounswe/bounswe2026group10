// One-off backfill script: fix ingredients where name_en === name_tr.
//
// For each such ingredient:
//   - translates name_tr → EN via DeepL to get the real English name
//   - translates name_en → TR via DeepL to get the real Turkish name
//   - skips the row if both translations come back identical to the stored
//     value (e.g. "oregano" is the same in both languages)
//   - otherwise shows a preview table, asks for confirmation, then updates
//
// Usage (from the backend/ directory):
//   node scripts/fix-ingredient-translations.js
//
// Requires SUPABASE_URL, SUPABASE_ANON_KEY, and DEEPL_API_KEY in .env

"use strict";

require("dotenv").config();
const readline = require("readline");
const { createClient } = require("@supabase/supabase-js");
const { Translator } = require("deepl-node");

// ─── Env validation ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌  SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env");
  process.exit(1);
}
if (!DEEPL_API_KEY) {
  console.error("❌  DEEPL_API_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const translator = new Translator(DEEPL_API_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Translate a batch of texts in one DeepL call. Returns an array of strings
// (same length as `texts`). Falls back to the original text on error.
async function translateBatch(texts, targetLang) {
  if (texts.length === 0) return [];
  try {
    const results = await translator.translateText(texts, null, targetLang);
    return (Array.isArray(results) ? results : [results]).map((r) => r.text);
  } catch (err) {
    console.error(`  DeepL error for target=${targetLang}:`, err.message);
    return texts; // fall back to originals
  }
}

function col(str, width) {
  if (str === null || str === undefined) str = "(null)";
  str = String(str);
  return str.length >= width ? str.slice(0, width - 1) + "…" : str.padEnd(width);
}

function printTable(rows) {
  const header = `${"ID".padEnd(6)} ${"name".padEnd(30)} ${"old name_en".padEnd(30)} ${"new name_en".padEnd(30)} ${"old name_tr".padEnd(30)} ${"new name_tr".padEnd(30)}`;
  const sep = "─".repeat(header.length);
  console.log("\n" + sep);
  console.log(header);
  console.log(sep);
  for (const r of rows) {
    console.log(
      `${col(r.id, 6)} ${col(r.name, 30)} ${col(r.oldEn, 30)} ${col(r.newEn, 30)} ${col(r.oldTr, 30)} ${col(r.newTr, 30)}`
    );
  }
  console.log(sep + "\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍  Fetching ingredients where name_en = name_tr …");

  const { data: ingredients, error } = await supabase
    .from("ingredients")
    .select("id, name, name_en, name_tr")
    .not("name_en", "is", null)
    .filter("name_en", "eq", supabase.rpc ? undefined : undefined); // PostgREST doesn't support column=column filters directly

  if (error) {
    console.error("❌  DB error:", error.message);
    process.exit(1);
  }

  // PostgREST can't do col = col in a single filter, so we filter in JS.
  const candidates = (ingredients || []).filter(
    (row) =>
      row.name_en !== null &&
      row.name_tr !== null &&
      row.name_en.trim().toLowerCase() === row.name_tr.trim().toLowerCase()
  );

  if (candidates.length === 0) {
    console.log("✅  No ingredients with matching name_en = name_tr found. Nothing to do.");
    return;
  }

  console.log(`  Found ${candidates.length} candidate(s). Translating via DeepL …\n`);

  // Batch both directions in parallel to minimise API round-trips.
  const nameTrList = candidates.map((r) => r.name_tr);
  const nameEnList = candidates.map((r) => r.name_en);

  const [translatedToEn, translatedToTr] = await Promise.all([
    translateBatch(nameTrList, "en-US"), // TR → EN
    translateBatch(nameEnList, "tr"),    // EN → TR
  ]);

  // Build list of rows that actually need updating.
  const toUpdate = [];

  for (let i = 0; i < candidates.length; i++) {
    const row = candidates[i];
    const newEn = translatedToEn[i].toLocaleLowerCase("tr-TR");
    const newTr = translatedToTr[i].toLocaleLowerCase("tr-TR");

    const enChanged = newEn !== row.name_en.trim().toLowerCase();
    const trChanged = newTr !== row.name_tr.trim().toLowerCase();

    if (!enChanged && !trChanged) {
      // Both translations are the same as stored (e.g. "oregano") — skip.
      console.log(`  ⏭   Skipping "${row.name}" — translations unchanged (likely language-agnostic).`);
      continue;
    }

    toUpdate.push({
      id: row.id,
      name: row.name,
      oldEn: row.name_en,
      newEn: enChanged ? newEn : row.name_en,
      oldTr: row.name_tr,
      newTr: trChanged ? newTr : row.name_tr,
    });
  }

  if (toUpdate.length === 0) {
    console.log("\n✅  All candidates are language-agnostic (same in both languages). Nothing to update.");
    return;
  }

  console.log(`\n📋  ${toUpdate.length} ingredient(s) will be updated:\n`);
  printTable(toUpdate);

  const answer = await ask(`Proceed with updating ${toUpdate.length} row(s)? [y/N] `);

  if (answer !== "y" && answer !== "yes") {
    console.log("⛔  Aborted — no changes made.");
    return;
  }

  console.log("\n⏳  Updating …");

  let successCount = 0;
  let errorCount = 0;

  for (const row of toUpdate) {
    const { error: updateError } = await supabase
      .from("ingredients")
      .update({ name_en: row.newEn, name_tr: row.newTr })
      .eq("id", row.id);

    if (updateError) {
      console.error(`  ❌  Failed to update id=${row.id} (${row.name}): ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`  ✅  Updated id=${row.id} "${row.name}": name_en="${row.newEn}", name_tr="${row.newTr}"`);
      successCount++;
    }
  }

  console.log(
    `\n🏁  Done — ${successCount} updated, ${errorCount} error(s).`
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
