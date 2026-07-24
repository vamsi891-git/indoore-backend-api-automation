/**
 * Read-only SQL aligned with backend MasterDataRepository list queries
 * (feeder/substation base SQL + DTR/meter/consumer list grain).
 * Used for API-vs-DB validation (no JWT data-scope filter unless noted).
 *
 * DTR meter type: backend `env.DTR_METER_TYPE_TBL_REF_ID` (production default 2).
 */

/** Active meters — listMeterMasterDataFromLookup default scope (no text filter). */
export const METER_MASTER_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM public."L_Meter_Lookup" lml
  WHERE lml."IsActiveStatus" = TRUE
`;

export const METER_MASTER_BY_SERIAL_SQL = `
  SELECT
    lml."MeterLookup_TblRefID" AS "meterLookupTblRefId",
    COALESCE(mm."MF", 0) AS mf,
    lml."Meter_Serial_Number" AS "meterSerialNumber",
    lml."IsActiveStatus" AS "isActiveStatus",
    lml."NetworkLookup_TblRefID" AS "networkLookupTblRefId",
    lml."OrganisationLookup_TblRefID" AS "organisationLookupTblRefId"
  FROM public."L_Meter_Lookup" lml
  LEFT JOIN public."M_Meter" mm
    ON mm."Meter_TblRefID" = lml."Meter_TblRefID"
  WHERE lml."Meter_Serial_Number" = $1
    AND lml."IsActiveStatus" = TRUE
  LIMIT 1
`;

/**
 * DTR master rows — active DTR network + active DTR-type meter on that network.
 * Matches listDtrMasterDataFromNetwork grain (MeterLookup on DTR hierarchy).
 * Param $1 = DTR_METER_TYPE_TBL_REF_ID.
 */
export const DTR_MASTER_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  INNER JOIN public."L_Meter_Lookup" ml
    ON ml."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
    AND ml."IsActiveStatus" = TRUE
    AND ml."MeterType_TblRefID" = $1
  WHERE mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND n."IsActiveStatus" = TRUE
    AND NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL
`;

/** Spot check by meter lookup id — hierarchy + meter fields from API DTR row. */
export const DTR_MASTER_BY_LOOKUP_SQL = `
  SELECT
    ml."MeterLookup_TblRefID" AS "meterLookupTblRefId",
    n."Network_Name" AS dtr,
    n."Network_Code" AS "dtrCode",
    feeder."Network_Name" AS feeder,
    substation."Network_Name" AS "subStation",
    zone."Office_Name" AS zone,
    division."Office_Name" AS division,
    circle."Office_Name" AS circle,
    TRIM(ml."Meter_Serial_Number") AS "meterSerialNumber",
    COALESCE(mm."MF"::text, '') AS mf,
    ml."Latitude"::text AS latitude,
    ml."Longitude"::text AS longitude
  FROM public."L_Meter_Lookup" ml
  INNER JOIN public."L_Network_Lookup" n
    ON n."NetworkLookup_TblRefID" = ml."NetworkLookup_TblRefID"
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  LEFT JOIN public."L_Network_Lookup" feeder
    ON feeder."NetworkLookup_TblRefID" = n."HigherNetwork_ID"
  LEFT JOIN public."L_Network_Lookup" substation
    ON substation."NetworkLookup_TblRefID" = feeder."HigherNetwork_ID"
  LEFT JOIN public."L_Organisation_Lookup" zone
    ON zone."OrganisationLookup_TblRefID" = n."OrganisationLookup_TblRefID"
  LEFT JOIN public."L_Organisation_Lookup" division
    ON division."OrganisationLookup_TblRefID" = zone."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" circle
    ON circle."OrganisationLookup_TblRefID" = division."HigherOffice_ID"
  LEFT JOIN public."M_Meter" mm
    ON mm."Meter_TblRefID" = ml."Meter_TblRefID"
  WHERE ml."MeterLookup_TblRefID" = $1
    AND mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
  LIMIT 1
`;

/**
 * Consumer master default list — active meters with a consumer service point
 * (listConsumerMasterDataFromView / meterType=all, no text filter).
 */
export const CONSUMER_MASTER_COUNT_SQL = `
  SELECT COUNT(DISTINCT lml."MeterLookup_TblRefID")::int AS total
  FROM public."L_Meter_Lookup" lml
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."MeterLookup_TblRefID" = lml."MeterLookup_TblRefID"
  INNER JOIN public."M_Consumer_Connection" mcc
    ON mcc."ConsumerConnection_TblRefID" = sp."ConsumerConnection_TblRefID"
  WHERE lml."IsActiveStatus" = TRUE
`;

export const CONSUMER_MASTER_BY_LOOKUP_SQL = `
  SELECT
    v."MeterLookup_TblRefID" AS "meterLookupTblRefId",
    v."Meter_Serial_Number" AS "meterSerialNumber",
    v."RRNumber" AS "ivrsNo"
  FROM public."V_Consumerdetails" v
  INNER JOIN public."L_Meter_Lookup" lml
    ON lml."MeterLookup_TblRefID" = v."MeterLookup_TblRefID"
  WHERE v."MeterLookup_TblRefID" = $1
    AND lml."IsActiveStatus" = TRUE
  LIMIT 1
`;

/** Backend feederMasterDataBaseSql — active feeders with hierarchy counts. */
export const FEEDER_MASTER_BASE_SQL = `
  SELECT
    n."Network_Name",
    n."NetworkLookup_TblRefID",
    n."OrganisationLookup_TblRefID",
    substation."Network_Name" AS "Substation_Name",
    zone."Office_Name" AS "Zone_Name",
    division."Office_Name" AS "Division_Name",
    circle."Office_Name" AS "Circle_Name",
    region."Office_Name" AS "Region_Name",
    discom."Office_Name" AS "Discom_Name",
    COALESCE(counts.dtr_count, 0)::bigint AS "dtr_count",
    COALESCE(counts.consumer_count, 0)::bigint AS "consumer_count"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  LEFT JOIN public."L_Network_Lookup" substation
    ON substation."NetworkLookup_TblRefID" = n."HigherNetwork_ID"
  LEFT JOIN public."L_Organisation_Lookup" zone
    ON zone."OrganisationLookup_TblRefID" = n."OrganisationLookup_TblRefID"
  LEFT JOIN public."L_Organisation_Lookup" division
    ON division."OrganisationLookup_TblRefID" = zone."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" circle
    ON circle."OrganisationLookup_TblRefID" = division."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" region
    ON region."OrganisationLookup_TblRefID" = circle."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" discom
    ON discom."OrganisationLookup_TblRefID" = region."HigherOffice_ID"
  LEFT JOIN LATERAL (
    WITH RECURSIVE network_subtree AS (
      SELECT net."NetworkLookup_TblRefID"
      FROM public."L_Network_Lookup" net
      WHERE net."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
      UNION ALL
      SELECT child."NetworkLookup_TblRefID"
      FROM public."L_Network_Lookup" child
      INNER JOIN network_subtree parent
        ON child."HigherNetwork_ID" = parent."NetworkLookup_TblRefID"
    ),
    dtr_nodes AS (
      SELECT ns."NetworkLookup_TblRefID"
      FROM network_subtree ns
      INNER JOIN public."L_Network_Lookup" net
        ON net."NetworkLookup_TblRefID" = ns."NetworkLookup_TblRefID"
      INNER JOIN public."M_Network_Hierarchy" mnh_dtr
        ON mnh_dtr."NetworkHierarchy_TblRefID" = net."NetworkHierarchy_TblRefID"
      WHERE mnh_dtr."NetworkHierarchy_Name" ILIKE '%DTR%'
        AND net."IsActiveStatus" = TRUE
    )
    SELECT
      (SELECT COUNT(*) FROM dtr_nodes)::bigint AS dtr_count,
      COUNT(DISTINCT lml."MeterLookup_TblRefID")::bigint AS consumer_count
    FROM dtr_nodes dn
    LEFT JOIN public."M_Consumer_Connection" mcc
      ON mcc."NetworkLookup_TblRefID" = dn."NetworkLookup_TblRefID"
    LEFT JOIN public."M_Consumer_Connection_ServicePoint" sp
      ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
    LEFT JOIN public."L_Meter_Lookup" lml
      ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
      AND lml."IsActiveStatus" = TRUE
  ) counts ON TRUE
  WHERE mnh."NetworkHierarchy_Name" = 'Feeder'
    AND n."IsActiveStatus" = TRUE
`;

export const FEEDER_MASTER_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM (${FEEDER_MASTER_BASE_SQL}) AS v
`;

export const FEEDER_MASTER_BY_NAME_SQL = `
  SELECT
    v."Network_Name" AS "feederName",
    v."Substation_Name" AS "substationName",
    v."Zone_Name" AS "zoneName",
    v."dtr_count"::int AS "dtrCount",
    v."consumer_count"::int AS "consumerCount"
  FROM (${FEEDER_MASTER_BASE_SQL}) AS v
  WHERE TRIM(v."Network_Name") = TRIM($1)
  LIMIT 1
`;

/** Backend substationMasterDataBaseSql — active substations. */
export const SUBSTATION_MASTER_BASE_SQL = `
  SELECT
    n."Network_Name",
    n."Network_Code",
    n."NetworkLookup_TblRefID",
    n."OrganisationLookup_TblRefID",
    zone."Office_Name" AS "Zone_Name",
    division."Office_Name" AS "Division_Name",
    circle."Office_Name" AS "Circle_Name",
    region."Office_Name" AS "Region_Name",
    discom."Office_Name" AS "Discom_Name",
    COALESCE(counts.dtr_count, 0)::bigint AS "dtr_count",
    COALESCE(counts.consumer_count, 0)::bigint AS "consumer_count"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  LEFT JOIN public."L_Organisation_Lookup" zone
    ON zone."OrganisationLookup_TblRefID" = n."OrganisationLookup_TblRefID"
  LEFT JOIN public."L_Organisation_Lookup" division
    ON division."OrganisationLookup_TblRefID" = zone."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" circle
    ON circle."OrganisationLookup_TblRefID" = division."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" region
    ON region."OrganisationLookup_TblRefID" = circle."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" discom
    ON discom."OrganisationLookup_TblRefID" = region."HigherOffice_ID"
  LEFT JOIN LATERAL (
    WITH RECURSIVE network_subtree AS (
      SELECT net."NetworkLookup_TblRefID"
      FROM public."L_Network_Lookup" net
      WHERE net."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
      UNION ALL
      SELECT child."NetworkLookup_TblRefID"
      FROM public."L_Network_Lookup" child
      INNER JOIN network_subtree parent
        ON child."HigherNetwork_ID" = parent."NetworkLookup_TblRefID"
    ),
    dtr_nodes AS (
      SELECT ns."NetworkLookup_TblRefID"
      FROM network_subtree ns
      INNER JOIN public."L_Network_Lookup" net
        ON net."NetworkLookup_TblRefID" = ns."NetworkLookup_TblRefID"
      INNER JOIN public."M_Network_Hierarchy" mnh_dtr
        ON mnh_dtr."NetworkHierarchy_TblRefID" = net."NetworkHierarchy_TblRefID"
      WHERE mnh_dtr."NetworkHierarchy_Name" ILIKE '%DTR%'
        AND net."IsActiveStatus" = TRUE
    )
    SELECT
      (SELECT COUNT(*) FROM dtr_nodes)::bigint AS dtr_count,
      COUNT(DISTINCT lml."MeterLookup_TblRefID")::bigint AS consumer_count
    FROM dtr_nodes dn
    LEFT JOIN public."M_Consumer_Connection" mcc
      ON mcc."NetworkLookup_TblRefID" = dn."NetworkLookup_TblRefID"
    LEFT JOIN public."M_Consumer_Connection_ServicePoint" sp
      ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
    LEFT JOIN public."L_Meter_Lookup" lml
      ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
      AND lml."IsActiveStatus" = TRUE
  ) counts ON TRUE
  WHERE mnh."NetworkHierarchy_Name" = 'Sub Station'
    AND n."IsActiveStatus" = TRUE
`;

export const SUBSTATION_MASTER_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM (${SUBSTATION_MASTER_BASE_SQL}) AS v
`;

export const SUBSTATION_MASTER_BY_CODE_SQL = `
  SELECT
    v."Network_Name" AS "substationName",
    v."Network_Code" AS "substationCode",
    v."Zone_Name" AS "zoneName",
    v."dtr_count"::int AS "dtrCount",
    v."consumer_count"::int AS "consumerCount"
  FROM (${SUBSTATION_MASTER_BASE_SQL}) AS v
  WHERE TRIM(COALESCE(v."Network_Code", '')) = TRIM($1)
  LIMIT 1
`;

/** meterSerialExists — M_Meter UNION L_Meter_Lookup. */
export const METER_SERIAL_EXISTS_SQL = `
  SELECT 1 AS one
  FROM public."M_Meter" mm
  WHERE mm."Meter_Serial_Number" = $1
  UNION ALL
  SELECT 1
  FROM public."L_Meter_Lookup" ml
  WHERE ml."Meter_Serial_Number" = $1
  LIMIT 1
`;

/** findDtrCodeExists — Network_Code match (case-insensitive). */
export const DTR_CODE_EXISTS_SQL = `
  SELECT TRUE AS ok
  FROM public."L_Network_Lookup" n
  WHERE UPPER(BTRIM(n."Network_Code")) = UPPER(BTRIM($1))
  LIMIT 1
`;

/**
 * isMeterAlreadyOnDtrNetwork — DTR-type meter on active DTR hierarchy.
 * Param $1 = meterLookupId, $2 = DTR_METER_TYPE_TBL_REF_ID.
 */
export const METER_ALREADY_ON_DTR_SQL = `
  SELECT TRUE AS ok
  FROM public."L_Meter_Lookup" ml
  INNER JOIN public."L_Network_Lookup" n
    ON n."NetworkLookup_TblRefID" = ml."NetworkLookup_TblRefID"
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE ml."MeterLookup_TblRefID" = $1
    AND ml."MeterType_TblRefID" = $2
    AND ml."IsActiveStatus" IS TRUE
    AND n."IsActiveStatus" IS TRUE
    AND mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
  LIMIT 1
`;

export const METER_COMMUNICATION_BY_SERIAL_SQL = `
  SELECT lml."Meter_Serial_Number" AS "meterSerialNumber"
  FROM public."L_Meter_Lookup" lml
  WHERE lml."Meter_Serial_Number" = $1
  LIMIT 1
`;
