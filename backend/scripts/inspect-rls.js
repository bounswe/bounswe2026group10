require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Tables to inspect.
  const tables = ["profiles", "expert_requests", "recipes", "comments"];

  for (const tbl of tables) {
    const meta = await client.query(
      `SELECT relname, relrowsecurity, relforcerowsecurity
       FROM pg_class
       WHERE relname = $1 AND relnamespace = 'public'::regnamespace`,
      [tbl]
    );
    console.log(`\n--- ${tbl} ---`);
    for (const r of meta.rows) {
      console.log(
        `  rowsecurity=${r.relrowsecurity}  forced=${r.relforcerowsecurity}`
      );
    }
    const policies = await client.query(
      `SELECT polname, polcmd, polroles::regrole[] AS roles,
              pg_get_expr(polqual,  polrelid) AS using_expr,
              pg_get_expr(polwithcheck, polrelid) AS with_check_expr,
              polpermissive
       FROM pg_policy
       WHERE polrelid = ('public.' || $1)::regclass
       ORDER BY polname`,
      [tbl]
    );
    if (policies.rowCount === 0) {
      console.log("  (no policies)");
    }
    for (const p of policies.rows) {
      console.log(
        `  policy ${p.polname} cmd=${p.polcmd} permissive=${p.polpermissive} roles=${p.roles}`
      );
      console.log(`    USING: ${p.using_expr ?? "—"}`);
      console.log(`    WITH CHECK: ${p.with_check_expr ?? "—"}`);
    }
  }

  // Look for the freshly-created learner that wasn't promoted.
  const stuck = await client.query(`
    SELECT p.id AS profile_id, p.username, p.role, p.updated_at,
           er.id AS request_id, er.status, er.decided_at, er.decided_by
    FROM expert_requests er
    JOIN profiles p ON p.id = er.user_id
    WHERE p.username ILIKE 'expertdeneme%'
    ORDER BY er.created_at DESC;
  `);
  console.log("\n--- expertdeneme_* state ---");
  for (const r of stuck.rows) {
    console.log(r);
  }

  await client.end();
})();
