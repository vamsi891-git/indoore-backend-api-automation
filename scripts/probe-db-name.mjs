import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const candidates = [
  process.env.DB_NAME?.trim(),
  "mdms_indore",
  "mdms_indore_qa",
  "mdms_test",
].filter(Boolean);

const unique = [...new Set(candidates)];

for (const database of unique) {
  const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
    connectionTimeoutMillis: 15_000,
  });

  try {
    const db = await pool.query("SELECT current_database() AS db");
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       AND (table_name ILIKE '%network%' OR table_name ILIKE '%dtr%' OR table_name ILIKE '%consumer%')
       ORDER BY table_name LIMIT 15`,
    );
    console.log(`\n=== ${db.rows[0].db} ===`);
    console.log("sample tables:", tables.rows.map((r) => r.table_name).join(", ") || "(none)");
  } catch (error) {
    console.log(`\n=== ${database} === FAILED:`, error instanceof Error ? error.message : error);
  } finally {
    await pool.end();
  }
}
