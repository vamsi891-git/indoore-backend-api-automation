import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME?.trim().toLowerCase(),
});

const views = await pool.query(
  `SELECT table_schema, table_name, table_type
   FROM information_schema.tables
   WHERE table_type IN ('VIEW', 'BASE TABLE')
     AND (
       table_name ILIKE '%consumer%master%'
       OR table_name ILIKE '%consumer%data%'
       OR table_name ILIKE 'v_%consumer%'
     )
   ORDER BY table_schema, table_name`,
);

console.log("Consumer-related tables/views:");
for (const row of views.rows) {
  console.log(`  ${row.table_schema}.${row.table_name} (${row.table_type})`);
}

const dtrViews = await pool.query(
  `SELECT table_schema, table_name
   FROM information_schema.tables
   WHERE table_type IN ('VIEW', 'BASE TABLE')
     AND table_name ILIKE '%dtr%'
   ORDER BY table_schema, table_name
   LIMIT 30`,
);
console.log("\nDTR-related tables/views (sample):");
for (const row of dtrViews.rows) {
  console.log(`  ${row.table_schema}.${row.table_name}`);
}

await pool.end();
