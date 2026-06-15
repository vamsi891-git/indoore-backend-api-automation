import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const tables = ["L_Meter_Lookup", "M_Network_Hierarchy", "L_Network_Lookup", "M_DTR"];

for (const table of tables) {
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table],
  );
  console.log(`\n${table}:`, result.rows.map((r) => r.column_name).join(", ") || "(not found)");
}

await pool.end();
