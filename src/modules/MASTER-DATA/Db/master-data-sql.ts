/**
 * Read-only SQL aligned with backend MasterDataRepository list queries.
 * Used for API-vs-DB total count validation (no JWT data-scope filter).
 */

/** DTR master rows — distinct (DTR network, meter) via service point; matches paged list grain. */
export const DTR_MASTER_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM (
    SELECT DISTINCT n."NetworkLookup_TblRefID", lml."MeterLookup_TblRefID"
    FROM public."L_Network_Lookup" n
    INNER JOIN public."M_Network_Hierarchy" mnh
      ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
    INNER JOIN public."M_Consumer_Connection" mcc
      ON mcc."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
    INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
      ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
    INNER JOIN public."L_Meter_Lookup" lml
      ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
      AND lml."IsActiveStatus" = TRUE
    WHERE mnh."NetworkHierarchy_Name" = 'DTR'
      AND n."IsActiveStatus" = TRUE
      AND NULLIF(TRIM(n."Network_Code"), '') IS NOT NULL
  ) dtr_rows
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
    COALESCE(counts.dtr_count, 0)::bigint AS dtr_count,
    COALESCE(counts.consumer_count, 0)::bigint AS consumer_count
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
    COALESCE(counts.dtr_count, 0)::bigint AS dtr_count,
    COALESCE(counts.consumer_count, 0)::bigint AS consumer_count
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
