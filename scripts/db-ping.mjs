/**
 * Verify PostgreSQL connectivity using DB_* from .env
 * Run: npm run db:ping
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 15_000,
  ...(process.env.DB_SSL === "true"
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

try {
  const version = await pool.query("SELECT version() AS version, current_database() AS db");
  console.log("DB connection OK");
  console.log(`  database: ${version.rows[0].db}`);
  console.log(`  version:  ${String(version.rows[0].version).slice(0, 80)}...`);

  const schemas = await pool.query(
    `SELECT schema_name FROM information_schema.schemata
     WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
     ORDER BY schema_name LIMIT 20`,
  );
  console.log("  schemas:", schemas.rows.map((r) => r.schema_name).join(", ") || "(none)");
} catch (error) {
  console.error("DB connection FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await pool.end();
}
