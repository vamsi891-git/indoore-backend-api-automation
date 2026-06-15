import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "postgres",
  connectionTimeoutMillis: 15_000,
  ...(process.env.DB_SSL === "true"
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

try {
  const result = await pool.query(
    `SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname`,
  );
  console.log("Available databases on", process.env.DB_HOST);
  result.rows.forEach((row) => console.log(`  - ${row.datname}`));
  console.log(`\nCurrent DB_NAME in .env: ${process.env.DB_NAME ?? "(not set)"}`);
} catch (error) {
  console.error("Connection failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await pool.end();
}
