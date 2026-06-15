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

const queries = {
  exactDtrHierarchy: `
    SELECT COUNT(*)::int AS c FROM public."L_Network_Lookup" n
    INNER JOIN public."M_Network_Hierarchy" mnh ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
    WHERE mnh."NetworkHierarchy_Name" = 'DTR' AND n."IsActiveStatus" = TRUE`,
  withMeterOnNetwork: `
    SELECT COUNT(DISTINCT n."NetworkLookup_TblRefID")::int AS c
    FROM public."L_Network_Lookup" n
    INNER JOIN public."M_Network_Hierarchy" mnh ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
    INNER JOIN public."L_Meter_Lookup" lml ON lml."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID" AND lml."IsActiveStatus" = TRUE
    WHERE mnh."NetworkHierarchy_Name" = 'DTR' AND n."IsActiveStatus" = TRUE`,
  withConsumerConnection: `
    SELECT COUNT(DISTINCT n."NetworkLookup_TblRefID")::int AS c
    FROM public."L_Network_Lookup" n
    INNER JOIN public."M_Network_Hierarchy" mnh ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
    INNER JOIN public."M_Consumer_Connection" mcc ON mcc."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
    WHERE mnh."NetworkHierarchy_Name" = 'DTR' AND n."IsActiveStatus" = TRUE`,
  consumerViewActive: `
    SELECT COUNT(DISTINCT "DTR_Name")::int AS c FROM public."V_Consumerdetails" WHERE "DTR_Name" IS NOT NULL`,
};

for (const [name, sql] of Object.entries(queries)) {
  const r = await pool.query(sql);
  console.log(`${name}:`, r.rows[0].c);
}

// find 10IW1
const iw = await pool.query(`
  SELECT n."Network_Code", n."Network_Name", lml."Meter_Serial_Number", lml."Latitude", lml."Longitude"
  FROM public."L_Network_Lookup" n
  LEFT JOIN public."L_Meter_Lookup" lml ON lml."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID" AND lml."IsActiveStatus" = TRUE
  WHERE n."Network_Code" = '10IW1' OR n."Network_Name" = '10IW1'
  LIMIT 5
`);
console.log("\n10IW1 lookup:", iw.rows);

// order by code matching API
const byCode = await pool.query(`
  SELECT n."Network_Code", n."Network_Name"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" = 'DTR' AND n."IsActiveStatus" = TRUE
    AND NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL
  ORDER BY n."Network_Code" ASC NULLS LAST
  LIMIT 3
`);
console.log("\nDTR with code, order by code:", byCode.rows);

const counts2 = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL)::int AS non_empty_code,
    COUNT(DISTINCT n."Network_Code") FILTER (WHERE NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL)::int AS distinct_code,
    COUNT(DISTINCT n."NetworkLookup_TblRefID") FILTER (WHERE NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL)::int AS distinct_id_with_code
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" = 'DTR' AND n."IsActiveStatus" = TRUE
`);
console.log("\nDTR code filters:", counts2.rows[0]);

// meter 19271515 on 10IW1
const m = await pool.query(`SELECT "Meter_Serial_Number","NetworkLookup_TblRefID","Latitude","Longitude" FROM public."L_Meter_Lookup" WHERE "Meter_Serial_Number"='19271515'`);
console.log("\nmeter 19271515:", m.rows);

await pool.end();
