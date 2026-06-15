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

const baseDtr = `
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" = 'DTR'
    AND n."IsActiveStatus" = TRUE
`;

const probes = {
  distinctMeterViaServicePoint: `
    SELECT COUNT(*)::int AS c FROM (
      SELECT DISTINCT n."NetworkLookup_TblRefID", lml."MeterLookup_TblRefID"
      ${baseDtr}
      INNER JOIN public."M_Consumer_Connection" mcc
        ON mcc."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
      INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
        ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
      INNER JOIN public."L_Meter_Lookup" lml
        ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
        AND lml."IsActiveStatus" = TRUE
    ) x`,
  distinctNetworkViaServicePoint: `
    SELECT COUNT(DISTINCT n."NetworkLookup_TblRefID")::int AS c
    ${baseDtr}
    INNER JOIN public."M_Consumer_Connection" mcc
      ON mcc."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
    INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
      ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
    INNER JOIN public."L_Meter_Lookup" lml
      ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
      AND lml."IsActiveStatus" = TRUE`,
  distinctCodeViaServicePoint: `
    SELECT COUNT(DISTINCT n."Network_Code")::int AS c
    ${baseDtr}
    AND NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL
    INNER JOIN public."M_Consumer_Connection" mcc
      ON mcc."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
    INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
      ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
    INNER JOIN public."L_Meter_Lookup" lml
      ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
      AND lml."IsActiveStatus" = TRUE`,
  consumerViewDistinctDtr: `
    SELECT COUNT(DISTINCT NULLIF(TRIM("DTR_Name"), ''))::int AS c
    FROM public."V_Consumerdetails"
    WHERE NULLIF(TRIM("Meter_Serial_Number"), '') IS NOT NULL`,
};

for (const [name, sql] of Object.entries(probes)) {
  const r = await pool.query(sql);
  console.log(name + ":", r.rows[0].c);
}

const net = await pool.query(`
  SELECT n."Network_Code", n."Network_Name", mnh."NetworkHierarchy_Name"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE n."NetworkLookup_TblRefID" = 1204
`);
console.log("\nnetwork 1204:", net.rows[0]);

// Proposed DTR page row for 10IW1 via service point, order by code
const page = await pool.query(`
  SELECT DISTINCT ON (n."Network_Code")
    n."Network_Code" AS dtr_code,
    COALESCE(NULLIF(TRIM(n."Network_Name"), ''), n."Network_Code") AS dtr_name,
    lml."Meter_Serial_Number" AS meter_serial_number,
    lml."Latitude"::text AS latitude,
    lml."Longitude"::text AS longitude
  ${baseDtr}
  AND NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL
  INNER JOIN public."M_Consumer_Connection" mcc
    ON mcc."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
  INNER JOIN public."L_Meter_Lookup" lml
    ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
    AND lml."IsActiveStatus" = TRUE
  ORDER BY n."Network_Code" ASC NULLS LAST, lml."Meter_Serial_Number" ASC
  LIMIT 3
`);
console.log("\nproposed first rows:", page.rows);

await pool.end();
