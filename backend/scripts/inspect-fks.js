require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // For every FK that references recipes(id) or profiles(id), show the
  // ON DELETE rule so we know what cascades when an admin deletes them.
  const q = `
    SELECT
      con.conname,
      cl_src.relname  AS src_table,
      a_src.attname   AS src_column,
      cl_tgt.relname  AS tgt_table,
      a_tgt.attname   AS tgt_column,
      CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
      END AS on_delete
    FROM pg_constraint con
    JOIN pg_class cl_src ON cl_src.oid = con.conrelid
    JOIN pg_class cl_tgt ON cl_tgt.oid = con.confrelid
    JOIN pg_namespace n ON n.oid = cl_src.relnamespace
    JOIN unnest(con.conkey)  WITH ORDINALITY AS u_src(attnum, ord) ON TRUE
    JOIN unnest(con.confkey) WITH ORDINALITY AS u_tgt(attnum, ord) ON u_src.ord = u_tgt.ord
    JOIN pg_attribute a_src ON a_src.attrelid = con.conrelid  AND a_src.attnum = u_src.attnum
    JOIN pg_attribute a_tgt ON a_tgt.attrelid = con.confrelid AND a_tgt.attnum = u_tgt.attnum
    WHERE con.contype = 'f'
      AND n.nspname = 'public'
      AND cl_tgt.relname IN ('recipes', 'profiles')
    ORDER BY tgt_table, src_table, src_column;
  `;
  const { rows } = await client.query(q);
  console.log("FKs referencing recipes/profiles:");
  for (const r of rows) {
    console.log(
      `  ${r.src_table}.${r.src_column} → ${r.tgt_table}.${r.tgt_column}  ON DELETE ${r.on_delete}  (${r.conname})`
    );
  }
  await client.end();
})();
