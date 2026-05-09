// One-off: promote profiles whose latest expert_request is 'approved' but
// whose role is still 'learner'/'cook' — i.e. rows that were silently skipped
// by the prior anon-client UPDATE under RLS.

require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const before = await client.query(`
    SELECT p.id, p.username, p.role
    FROM profiles p
    JOIN expert_requests er ON er.user_id = p.id
    WHERE er.status = 'approved'
      AND p.role <> 'expert'
      AND p.role <> 'admin'
    ORDER BY er.decided_at DESC NULLS LAST;
  `);
  console.log("Profiles to fix:");
  for (const r of before.rows) console.log(" ", r);

  if (before.rowCount === 0) {
    console.log("Nothing to do.");
    await client.end();
    return;
  }

  const ids = before.rows.map((r) => r.id);
  const { rowCount } = await client.query(
    `UPDATE profiles
       SET role = 'expert', updated_at = now()
     WHERE id = ANY($1::uuid[])
       AND role <> 'admin'`,
    [ids]
  );
  console.log(`Promoted ${rowCount} profile(s).`);

  const after = await client.query(
    `SELECT id, username, role FROM profiles WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  console.log("After:");
  for (const r of after.rows) console.log(" ", r);

  await client.end();
})();
