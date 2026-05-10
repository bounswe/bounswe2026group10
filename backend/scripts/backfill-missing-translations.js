// One-off backfill script: populate NULL name_en / name_tr fields via DeepL.
//
// Pass 1 — name_tr IS NULL: translates name_en → TR and writes name_tr.
// Pass 2 — name_en IS NULL: translates name_tr → EN and writes name_en.
//
// Rows that already have both fields populated are skipped entirely.
//
// Client selection:
//   - SUPABASE_SERVICE_ROLE_KEY → service-role client (bypasses RLS, preferred)
//   - Otherwise → anon client (UPDATE may be silently blocked by RLS policies)
//
// Usage (from the backend/ directory):
//   node scripts/backfill-missing-translations.js
//
// Requires SUPABASE_URL, SUPABASE_ANON_KEY, DEEPL_API_KEY in .env
// Optionally: SUPABASE_SERVICE_ROLE_KEY

"use strict";

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { Translator } = require("deepl-node");

const BATCH_SIZE = 50; // DeepL accepts up to 50 texts per call

// ─── Env validation ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌  SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env");
  process.exit(1);
}
if (!DEEPL_API_KEY) {
  console.error("❌  DEEPL_API_KEY must be set in .env");
  process.exit(1);
}

// ─── Client setup ─────────────────────────────────────────────────────────────

let supabase;
if (SUPABASE_SERVICE_ROLE_KEY) {
  console.log("🔑  Using service-role client (bypasses RLS).");
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
} else {
  console.warn(
    "⚠️   SUPABASE_SERVICE_ROLE_KEY not found — falling back to anon client.\n" +
      "    UPDATE operations may be silently blocked by RLS policies.\n" +
      "    If rows report success but values don't change, add the service-role key."
  );
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const translator = new Translator(DEEPL_API_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Splits an array into chunks of at most `size` elements.
function chunks(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// Translates a batch of texts via DeepL. Returns translated strings in the
// same order. Falls back to the original text for any item that errors out.
async function translateBatch(texts, targetLang) {
  if (texts.length === 0) return [];
  const results = await translator.translateText(texts, null, targetLang);
  return (Array.isArray(results) ? results : [results]).map((r) => r.text);
}

// ─── Core pass ────────────────────────────────────────────────────────────────

// Fetches all rows where `nullColumn` IS NULL (and `sourceColumn` IS NOT NULL),
// translates `sourceColumn` to `targetLang`, and writes the result back into
// `nullColumn`.
//
// Returns { updated, errors } counts.
async function runPass({ nullColumn, sourceColumn, targetLang, passLabel }) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${passLabel}`);
  console.log(`${"═".repeat(60)}`);

  // Fetch all candidates up-front (ingredient table is small enough).
  const { data: rows, error: fetchError } = await supabase
    .from("ingredients")
    .select("id, name, name_en, name_tr")
    .is(nullColumn, null)
    .not(sourceColumn, "is", null);

  if (fetchError) {
    console.error(`  ❌  Failed to fetch rows: ${fetchError.message}`);
    return { updated: 0, errors: 1 };
  }

  if (!rows || rows.length === 0) {
    console.log(`  ✅  No rows with ${nullColumn} IS NULL. Nothing to do.`);
    return { updated: 0, errors: 0 };
  }

  console.log(`  Found ${rows.length} row(s) to process.\n`);

  const batches = chunks(rows, BATCH_SIZE);
  let updated = 0;
  let errors = 0;

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const batchLabel = `Batch ${bi + 1}/${batches.length} (${batch.length} item(s))`;
    process.stdout.write(`  ⏳  ${batchLabel} — translating … `);

    // Translate the source texts for this batch.
    let translations;
    try {
      const sourceTexts = batch.map((r) => r[sourceColumn]);
      translations = await translateBatch(sourceTexts, targetLang);
    } catch (err) {
      console.error(`\n  ❌  DeepL error on ${batchLabel}: ${err.message}`);
      console.error("      Skipping this batch and continuing.");
      errors += batch.length;
      continue;
    }

    process.stdout.write("done. Writing … ");

    // Write results one-by-one so a single DB failure doesn't block the rest.
    let batchSuccess = 0;
    let batchFail = 0;

    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      const translated = translations[i].toLocaleLowerCase("tr-TR");

      const { error: updateError } = await supabase
        .from("ingredients")
        .update({ [nullColumn]: translated })
        .eq("id", row.id);

      if (updateError) {
        console.error(
          `\n  ❌  id=${row.id} "${row.name}": ${updateError.message}`
        );
        batchFail++;
        errors++;
      } else {
        if (process.env.VERBOSE) {
          console.log(
            `\n  ✅  id=${row.id} "${row.name}": ${nullColumn}="${translated}"`
          );
        }
        batchSuccess++;
        updated++;
      }
    }

    console.log(`${batchSuccess} ok, ${batchFail} error(s).`);
  }

  return { updated, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Backfill missing ingredient translations\n");

  const pass1 = await runPass({
    nullColumn: "name_tr",
    sourceColumn: "name_en",
    targetLang: "tr",
    passLabel: "Pass 1 — name_en → TR (fill missing name_tr)",
  });

  const pass2 = await runPass({
    nullColumn: "name_en",
    sourceColumn: "name_tr",
    targetLang: "en-US",
    passLabel: "Pass 2 — name_tr → EN (fill missing name_en)",
  });

  const totalUpdated = pass1.updated + pass2.updated;
  const totalErrors = pass1.errors + pass2.errors;

  console.log(`\n${"═".repeat(60)}`);
  console.log(
    `  🏁  Backfill complete — ${totalUpdated} row(s) updated, ${totalErrors} error(s).`
  );
  if (totalErrors > 0 && !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "\n  ⚠️   Some updates may have been silently blocked by RLS.\n" +
        "      Re-run with SUPABASE_SERVICE_ROLE_KEY set to verify."
    );
  }
  console.log(`${"═".repeat(60)}\n`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
