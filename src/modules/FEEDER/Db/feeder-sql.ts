/**
 * Read-only SQL for FEEDER DB cross-validation.
 * Aligned with L_Network_Lookup Feeder hierarchy (MASTER-DATA feeder master).
 * Gated by FEEDER_DB_SQL_READY=true.
 */

/**
 * Resolve feeder by Network_Code.
 * Params: $1 = feederCode
 */
export const FEEDER_BY_CODE_SQL = `
  SELECT
    COALESCE(TRIM(n."Network_Code"), '') AS "feederCode",
    COALESCE(TRIM(n."Network_Name"), '') AS "feederName",
    COALESCE(n."IsActiveStatus", FALSE) AS "isActive",
    n."NetworkLookup_TblRefID"::int AS "networkLookupTblRefId"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" = 'Feeder'
    AND TRIM(n."Network_Code") = TRIM($1::text)
  LIMIT 1
`;

/**
 * Child DTR count under feeder subtree (first-level + recursive).
 * Params: $1 = feeder NetworkLookup_TblRefID
 */
export const FEEDER_CHILD_DTR_COUNT_SQL = `
  WITH RECURSIVE network_subtree AS (
    SELECT net."NetworkLookup_TblRefID"
    FROM public."L_Network_Lookup" net
    WHERE net."NetworkLookup_TblRefID" = $1::int
    UNION ALL
    SELECT child."NetworkLookup_TblRefID"
    FROM public."L_Network_Lookup" child
    INNER JOIN network_subtree parent
      ON child."HigherNetwork_ID" = parent."NetworkLookup_TblRefID"
  )
  SELECT COUNT(*)::int AS count
  FROM network_subtree ns
  INNER JOIN public."L_Network_Lookup" net
    ON net."NetworkLookup_TblRefID" = ns."NetworkLookup_TblRefID"
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = net."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND net."IsActiveStatus" = TRUE
    AND net."NetworkLookup_TblRefID" <> $1::int
`;

/**
 * Meter serial existence (electrical / alerts soft checks).
 * Params: $1 = meterSerialNumber
 */
export const FEEDER_METER_BY_SERIAL_SQL = `
  SELECT
    COALESCE(TRIM(lml."Meter_Serial_Number"), '') AS "meterSerialNumber",
    lml."MeterLookup_TblRefID"::int AS "meterLookupTblRefId",
    COALESCE(lml."IsActiveStatus", FALSE) AS "isActive"
  FROM public."L_Meter_Lookup" lml
  WHERE TRIM(lml."Meter_Serial_Number") = TRIM($1::text)
  LIMIT 1
`;

export const FEEDER_SQL_TODO =
  "Alerts event archive + daily consumption kWh SQL deferred until backend repository paste";
