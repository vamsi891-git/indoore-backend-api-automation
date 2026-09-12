/**
 * Read-only SQL aligned with DtrRepository.getDtrBaseByCode
 * (dtrMasterConnectionSubquerySql + Network_Code match).
 * Gated by DTRS_DB_SQL_READY=true.
 *
 * Param $1 = DTR_METER_TYPE_TBL_REF_ID, $2 = dtrCode.
 */

/** Same grain as shared/sql/dtr-master-sql.ts dtrMasterConnectionSubquerySql. */
const DTR_MASTER_CONNECTION_SUBQUERY = `
  SELECT
    org3."Office_Name" AS "Circle",
    org2."Office_Name" AS "Division",
    org."Office_Name" AS "Zone",
    grandparent."Network_Name" AS "Sub Station",
    parent."Network_Name" AS "Feeder",
    n."Network_Code" AS "CODE",
    COALESCE(
      NULLIF(BTRIM(n."Network_Code"), ''),
      NULLIF(BTRIM(n."Network_Name"), ''),
      NULLIF(BTRIM(n."Network_Name_New"), '')
    ) AS "DTR Name",
    n."NetworkLookup_TblRefID",
    n."OrganisationLookup_TblRefID",
    lml."MeterLookup_TblRefID",
    n."Network_Address",
    lml."Meter_Serial_Number" AS "Meter Serial Number",
    CAST(mm."MF" AS TEXT) AS "MF",
    CAST(lml."Latitude" AS TEXT) AS "Latitude",
    CAST(lml."Longitude" AS TEXT) AS "Longitude"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  LEFT JOIN public."L_Meter_Lookup" lml
    ON lml."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
   AND lml."MeterType_TblRefID" = $1::int
   AND lml."IsActiveStatus" = TRUE
   AND COALESCE(lml."IsTestMeter", FALSE) = FALSE
  LEFT JOIN public."M_Meter" mm
    ON mm."Meter_Serial_Number" = lml."Meter_Serial_Number"
  LEFT JOIN public."L_Network_Lookup" parent
    ON parent."NetworkLookup_TblRefID" = n."HigherNetwork_ID"
  LEFT JOIN public."L_Network_Lookup" grandparent
    ON grandparent."NetworkLookup_TblRefID" = parent."HigherNetwork_ID"
  LEFT JOIN public."L_Organisation_Lookup" org
    ON org."OrganisationLookup_TblRefID" = n."OrganisationLookup_TblRefID"
  LEFT JOIN public."L_Organisation_Lookup" org2
    ON org2."OrganisationLookup_TblRefID" = org."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" org3
    ON org3."OrganisationLookup_TblRefID" = org2."HigherOffice_ID"
  WHERE mnh."NetworkHierarchy_Name" = 'DTR'
    AND n."IsActiveStatus" = TRUE
    AND NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL
    AND n."Network_Name" !~ '^[0-9]{6,}'
`;

/** Unscoped active DTR master count (same WHERE as subquery, distinct network). */
export const DTRS_ACTIVE_DTR_COUNT_SQL = `
  SELECT COUNT(DISTINCT n."NetworkLookup_TblRefID")::int AS total
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" = 'DTR'
    AND n."IsActiveStatus" = TRUE
    AND NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL
    AND n."Network_Name" !~ '^[0-9]{6,}'
`;

/**
 * getDtrBaseByCode projection — params $1 = DTR meter type, $2 = dtrCode.
 */
export const DTRS_BASE_BY_CODE_SQL = `
  SELECT
    v."NetworkLookup_TblRefID" AS "networkLookupId",
    v."CODE" AS "networkCode",
    COALESCE(NULLIF(TRIM(v."DTR Name"), ''), v."CODE") AS "networkName",
    COALESCE(v."Network_Address", '') AS "networkAddress",
    v."Circle" AS circle,
    v."Division" AS division,
    v."Zone" AS zone,
    v."Sub Station" AS "subStation",
    v."Feeder" AS feeder,
    v."Meter Serial Number" AS "meterSerialNumber",
    v."MF" AS mf
  FROM (
    ${DTR_MASTER_CONNECTION_SUBQUERY}
  ) AS v
  WHERE UPPER(BTRIM(COALESCE(v."CODE", ''))) = UPPER(BTRIM($2::text))
  ORDER BY
    v."DTR Name" ASC NULLS LAST,
    v."CODE" ASC NULLS LAST,
    v."Meter Serial Number" ASC NULLS LAST
  LIMIT 1
`;

/**
 * Ancestor Feeder count for a DTR network id — getDtrFeedersByCode grain.
 * Param $1 = dtr NetworkLookup_TblRefID.
 */
export const DTRS_FEEDER_ANCESTOR_COUNT_SQL = `
  WITH RECURSIVE up AS (
    SELECT
      n."NetworkLookup_TblRefID",
      n."HigherNetwork_ID",
      COALESCE(mnh."NetworkHierarchy_Name", '') AS "HierarchyName",
      0 AS depth
    FROM public."L_Network_Lookup" n
    LEFT JOIN public."M_Network_Hierarchy" mnh
      ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
    WHERE n."NetworkLookup_TblRefID" = $1::int
    UNION ALL
    SELECT
      p."NetworkLookup_TblRefID",
      p."HigherNetwork_ID",
      COALESCE(mnhp."NetworkHierarchy_Name", ''),
      u.depth + 1
    FROM up u
    INNER JOIN public."L_Network_Lookup" p
      ON p."NetworkLookup_TblRefID" = u."HigherNetwork_ID"
    LEFT JOIN public."M_Network_Hierarchy" mnhp
      ON mnhp."NetworkHierarchy_TblRefID" = p."NetworkHierarchy_TblRefID"
    WHERE u."HigherNetwork_ID" IS NOT NULL
      AND u."HigherNetwork_ID" <> 0
  )
  SELECT COUNT(*)::int AS total
  FROM up
  WHERE depth > 0
    AND LOWER(TRIM("HierarchyName")) = 'feeder'
`;
