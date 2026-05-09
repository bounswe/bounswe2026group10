// One-off migration runner.
// Usage:  node scripts/run-migration.js <relative-or-absolute-path-to-sql>
//
// Reads DIRECT_URL from backend/.env and applies the SQL file as a single
// query (the file is expected to wrap itself in BEGIN/COMMIT).

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/run-migration.js <path-to-sql>");
    process.exit(2);
  }
  const sqlPath = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found: ${sqlPath}`);
    process.exit(2);
  }
  const sql = fs.readFileSync(sqlPath, "utf8");

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DIRECT_URL (or DATABASE_URL) not set in environment.");
    process.exit(2);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`→ Connecting to database…`);
  await client.connect();

  try {
    console.log(`→ Applying migration: ${path.relative(process.cwd(), sqlPath)}`);
    await client.query(sql);
    console.log("✓ Migration applied successfully.");
  } catch (err) {
    console.error("✗ Migration failed:");
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
