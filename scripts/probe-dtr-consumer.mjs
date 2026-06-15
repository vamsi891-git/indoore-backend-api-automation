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

const cols = await pool.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'V_Consumerdetails'
   ORDER BY ordinal_position`,
);
console.log("V_Consumerdetails columns:", cols.rows.map((r) => r.column_name).join(", "));

const count = await pool.query(`SELECT COUNT(*)::int AS c FROM public."V_Consumerdetails"`);
console.log("row count:", count.rows[0].c);

const sample = await pool.query(`SELECT * FROM public."V_Consumerdetails" LIMIT 1`);
console.log("sample keys:", Object.keys(sample.rows[0] || {}));

// DTR: compare API first row sort - order by dtrName ascending, first is 10IW1
const dtrCount = await pool.query(`
  SELECT COUNT(*)::int AS c
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND n."IsActiveStatus" = TRUE
`);
console.log("\nDTR count (simple hierarchy filter):", dtrCount.rows[0].c);

const dtrDistinct = await pool.query(`
  SELECT COUNT(*)::int AS c FROM (
    SELECT DISTINCT ON (n."NetworkLookup_TblRefID") n."NetworkLookup_TblRefID"
    FROM public."L_Network_Lookup" n
    INNER JOIN public."M_Network_Hierarchy" mnh
      ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
    LEFT JOIN public."M_Consumer_Connection" mcc
      ON mcc."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
    LEFT JOIN public."M_Consumer_Connection_ServicePoint" sp
      ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
    LEFT JOIN public."L_Meter_Lookup" lml
      ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
      AND lml."IsActiveStatus" = TRUE
    WHERE mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
      AND n."IsActiveStatus" = TRUE
  ) x
`);
console.log("DTR count (current DISTINCT ON SQL):", dtrDistinct.rows[0].c);

// Try ordering by Network_Code like API might use dtrName = code
const firstByCode = await pool.query(`
  SELECT n."Network_Code", n."Network_Name"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND n."IsActiveStatus" = TRUE
  ORDER BY n."Network_Code" ASC NULLS LAST
  LIMIT 3
`);
console.log("\nFirst DTRs by Network_Code:", firstByCode.rows);

const firstByName = await pool.query(`
  SELECT n."Network_Code", n."Network_Name"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND n."IsActiveStatus" = TRUE
  ORDER BY n."Network_Name" ASC NULLS LAST
  LIMIT 3
`);
console.log("First DTRs by Network_Name:", firstByName.rows);

const hierarchyNames = await pool.query(`
  SELECT DISTINCT mnh."NetworkHierarchy_Name"
  FROM public."M_Network_Hierarchy" mnh
  WHERE mnh."NetworkHierarchy_Name" ILIKE '%dtr%'
`);
console.log("\nDTR hierarchy names:", hierarchyNames.rows.map((r) => r.NetworkHierarchy_Name));

await pool.end();
