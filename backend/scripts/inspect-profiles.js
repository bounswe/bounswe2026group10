require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const constraints = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
    ORDER BY conname;
  `);
  console.log("--- profiles constraints ---");
  for (const r of constraints.rows) console.log(r.conname, "::", r.def);

  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
    ORDER BY ordinal_position;
  `);
  console.log("\n--- profiles columns ---");
  for (const r of cols.rows) console.log(r.column_name, r.data_type, r.is_nullable, r.column_default);

  const roleCounts = await client.query(`
    SELECT role, count(*) AS n FROM public.profiles GROUP BY role ORDER BY role;
  `);
  console.log("\n--- existing role counts ---");
  for (const r of roleCounts.rows) console.log(r.role, r.n);

  const expertReqExists = await client.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='expert_requests';
  `);
  console.log("\nexpert_requests table exists?", expertReqExists.rowCount > 0);

  await client.end();
})();
