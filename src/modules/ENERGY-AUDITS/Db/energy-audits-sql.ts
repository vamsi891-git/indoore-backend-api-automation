/**
 * Read-only SQL aligned with EnergyAuditRepository.getPagedDtrs
 * (DTR count under feeder/network root + DTR identity spot).
 * Gated by ENERGY_AUDITS_DB_SQL_READY=true.
 *
 * Count omits JWT data-scope — use API total ≤ DB count.
 * Loss kWh / efficiency are computed from archive readings — not DB-checked here.
 */

/**
 * Active DTR networks under a root networkLookupId (recursive subtree).
 * Param $1 = networkLookupId (feeder/substation/circle anchor).
 */
export const ENERGY_AUDIT_DTR_COUNT_UNDER_ROOT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM public."L_Network_Lookup" n
  JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE n."IsActiveStatus" = TRUE
    AND mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND n."NetworkLookup_TblRefID" IN (
      WITH RECURSIVE net_sub AS (
        SELECT "NetworkLookup_TblRefID"
        FROM public."L_Network_Lookup"
        WHERE "NetworkLookup_TblRefID" = $1::int
        UNION ALL
        SELECT c."NetworkLookup_TblRefID"
        FROM public."L_Network_Lookup" c
        JOIN net_sub p ON c."HigherNetwork_ID" = p."NetworkLookup_TblRefID"
      )
      SELECT "NetworkLookup_TblRefID" FROM net_sub
    )
`;

/**
 * Spot DTR identity by Network_Name (API dtrName) under root.
 * Params: $1 = networkLookupId, $2 = dtrName, $3 = DTR_METER_TYPE_TBL_REF_ID.
 */
export const ENERGY_AUDIT_DTR_BY_NAME_UNDER_ROOT_SQL = `
  SELECT
    n."NetworkLookup_TblRefID" AS dtr_id,
    n."Network_Name" AS dtr_name,
    n."Network_Code" AS dtr_code,
    NULLIF(BTRIM(lml."Meter_Serial_Number"), '') AS meter_serial,
    (
      SELECT COUNT(DISTINCT mcc."ConsumerConnection_TblRefID")::int
      FROM public."M_Consumer_Connection" mcc
      INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
        ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
        AND (sp."IsActive" IS NULL OR sp."IsActive" = 1)
        AND sp."MeterLookup_TblRefID" IS NOT NULL
      INNER JOIN public."L_Meter_Lookup" clml
        ON clml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
        AND clml."IsActiveStatus" = TRUE
        AND COALESCE(NULLIF(BTRIM(clml."Meter_Serial_Number"), ''), '') <> ''
      WHERE mcc."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
    ) AS consumer_count
  FROM public."L_Network_Lookup" n
  JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  LEFT JOIN LATERAL (
    SELECT lml_inner."Meter_Serial_Number"
    FROM public."L_Meter_Lookup" lml_inner
    WHERE lml_inner."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
      AND lml_inner."IsActiveStatus" = TRUE
      AND lml_inner."MeterType_TblRefID" = $3::int
      AND lml_inner.isnetmeter IS DISTINCT FROM TRUE
    ORDER BY lml_inner."MeterLookup_TblRefID" DESC
    LIMIT 1
  ) lml ON TRUE
  WHERE n."IsActiveStatus" = TRUE
    AND mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND BTRIM(n."Network_Name") = BTRIM($2::text)
    AND n."NetworkLookup_TblRefID" IN (
      WITH RECURSIVE net_sub AS (
        SELECT "NetworkLookup_TblRefID"
        FROM public."L_Network_Lookup"
        WHERE "NetworkLookup_TblRefID" = $1::int
        UNION ALL
        SELECT c."NetworkLookup_TblRefID"
        FROM public."L_Network_Lookup" c
        JOIN net_sub p ON c."HigherNetwork_ID" = p."NetworkLookup_TblRefID"
      )
      SELECT "NetworkLookup_TblRefID" FROM net_sub
    )
  ORDER BY n."NetworkLookup_TblRefID"
  LIMIT 1
`;
