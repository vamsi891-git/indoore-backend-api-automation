/**
 * Read-only SQL for DASHBOARD DB cross-validation.
 * Consumer widgets: `DashboardConsumerMetricsRepository` (unscoped).
 * DTR last-seen widgets: meter_last_seen path.
 * Gated by DASHBOARD_DB_SQL_READY=true.
 */

/**
 * `meterBasedConsumerSubquerySql` from shared/sql/consumer-master-sql.ts.
 * Live spine: M_Consumer_Connection → service point → L_Meter_Lookup → M_Consumer
 * + required category/phase/status joins.
 * One row per IVRS (`DISTINCT ON` RRNumber). Active flags:
 * `consumerMasterGridActiveWhereSql` (active consumer + service point + mcc.is_active).
 */
export const DASHBOARD_METER_BASED_CONSUMER_SQL = `
  SELECT DISTINCT ON (NULLIF(BTRIM(mcc."RRNumber"), ''))
    mcc."ConsumerConnection_TblRefID",
    mcc."ConnectionStatus_TblRefID",
    mccc."Category_TblRefID",
    lml."ServicePointMeterPhase_TblRefID",
    lml."DeviceManufacturer_TblRefID",
    mcc."PaymentContract_TblRefID",
    lml.isnetmeter,
    mcc."OrganisationLookup_TblRefID",
    mcc."NetworkLookup_TblRefID",
    lml."MeterLookup_TblRefID",
    mc."Consumer_TblRefID",
    NULLIF(BTRIM(mcc."RRNumber"), '') AS "RRNumber"
  FROM public."M_Consumer_Connection" mcc
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
  INNER JOIN public."L_Meter_Lookup" lml
    ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
  INNER JOIN public."M_Consumer" mc
    ON mc."Consumer_TblRefID" = mcc."Consumer_TblRefID"
  INNER JOIN public."M_Connection_Category" mccc
    ON mccc."ConnectionCategory_TblRefID" = mcc."ConnectionCategory_TblRefID"
  INNER JOIN public."M_ServicePoint_MeterPhase" mpp
    ON mpp."ServicePointMeterPhase_TblRefID" = lml."ServicePointMeterPhase_TblRefID"
  INNER JOIN public."M_Connection_Status" mcs
    ON mcs."ConnectionStatus_TblRefID" = mcc."ConnectionStatus_TblRefID"
  WHERE mc."IsActiveStatus" IS TRUE
    AND COALESCE(sp."IsActive", 0) = 1
    AND mcc.is_active IS TRUE
    AND NULLIF(BTRIM(mcc."RRNumber"), '') IS NOT NULL
  ORDER BY
    NULLIF(BTRIM(mcc."RRNumber"), '') ASC,
    (lml."IsActiveStatus" IS TRUE) DESC,
    lml."MeterLookup_TblRefID" ASC,
    mcc."ConsumerConnection_TblRefID" ASC
`;

/** `consumerDashboardDistinctIvrsCountExprSql` */
const DASHBOARD_DISTINCT_IVRS_SQL = `COUNT(DISTINCT NULLIF(BTRIM(v."RRNumber"), ''))`;

/** `getConnectionStatusCounts` — distinct IVRS by M_Connection_Status.shortName. */
export const DASHBOARD_CONNECTION_STATUS_COUNTS_SQL = `
  SELECT
    COUNT(DISTINCT NULLIF(BTRIM(v."RRNumber"), ''))
      FILTER (WHERE LOWER(BTRIM(mcs."shortName")) = 'cd')::int AS cd,
    COUNT(DISTINCT NULLIF(BTRIM(v."RRNumber"), ''))
      FILTER (WHERE LOWER(BTRIM(mcs."shortName")) = 'td')::int AS td,
    COUNT(DISTINCT NULLIF(BTRIM(v."RRNumber"), ''))
      FILTER (WHERE LOWER(BTRIM(mcs."shortName")) = 'pd')::int AS pd,
    ${DASHBOARD_DISTINCT_IVRS_SQL}::int AS total_meter_count
  FROM (${DASHBOARD_METER_BASED_CONSUMER_SQL}) v
  INNER JOIN public."M_Connection_Status" mcs
    ON v."ConnectionStatus_TblRefID" = mcs."ConnectionStatus_TblRefID"
`;

/** `consumerDashboardCategoryDistributionSql` with unscoped WHERE TRUE. */
export const DASHBOARD_CATEGORY_COUNTS_SQL = `
  SELECT
    mcat."CategoryName" AS key,
    mcat."Category_TblRefID" AS id,
    ${DASHBOARD_DISTINCT_IVRS_SQL}::int AS count
  FROM (${DASHBOARD_METER_BASED_CONSUMER_SQL}) v
  LEFT JOIN public."M_Category" mcat
    ON v."Category_TblRefID" = mcat."Category_TblRefID"
  WHERE TRUE
  GROUP BY mcat."CategoryName", mcat."Category_TblRefID"
`;

/** `getPhaseWiseCounts` — distinct IVRS by meter-phase ShortName. */
export const DASHBOARD_PHASE_COUNTS_SQL = `
  SELECT
    mph."ShortName" AS key,
    ${DASHBOARD_DISTINCT_IVRS_SQL}::int AS count
  FROM (${DASHBOARD_METER_BASED_CONSUMER_SQL}) v
  JOIN public."M_ServicePoint_MeterPhase" mph
    ON v."ServicePointMeterPhase_TblRefID" = mph."ServicePointMeterPhase_TblRefID"
  GROUP BY mph."ShortName"
`;

/** `getOemWiseCounts` — distinct IVRS by active manufacturer name. */
export const DASHBOARD_OEM_COUNTS_SQL = `
  SELECT
    mdm."Manufacturer_Name" AS key,
    ${DASHBOARD_DISTINCT_IVRS_SQL}::int AS count
  FROM (${DASHBOARD_METER_BASED_CONSUMER_SQL}) v
  INNER JOIN (
    SELECT DISTINCT ON (m."DeviceManufacturer_TblRefID")
      m."DeviceManufacturer_TblRefID",
      m."Manufacturer_Name"
    FROM public."M_Device_Manufacturer" m
    WHERE m."IsActiveStatus" IS TRUE
    ORDER BY m."DeviceManufacturer_TblRefID" ASC, TRIM(m."Manufacturer_Name") ASC
  ) mdm ON v."DeviceManufacturer_TblRefID" = mdm."DeviceManufacturer_TblRefID"
  GROUP BY mdm."Manufacturer_Name"
`;

/** `getNetworkDetails` consumer count — distinct IVRS. */
export const DASHBOARD_SCOPED_CONSUMER_COUNT_SQL = `
  SELECT ${DASHBOARD_DISTINCT_IVRS_SQL}::int AS count
  FROM (${DASHBOARD_METER_BASED_CONSUMER_SQL}) v
`;

/**
 * `feederSubstationCatalogSql` — active Feeder / Sub Station lookup rows.
 */
export const DASHBOARD_FEEDER_SUBSTATION_CATALOG_SQL = `
  SELECT
    n."NetworkLookup_TblRefID",
    mnh."NetworkHierarchy_Name"
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE n."IsActiveStatus" IS TRUE
    AND mnh."NetworkHierarchy_Name" IN ('Feeder', 'Sub Station')
`;

export const DASHBOARD_FEEDER_SUBSTATION_COUNTS_SQL = `
  SELECT
    v."NetworkHierarchy_Name" AS key,
    COUNT(DISTINCT v."NetworkLookup_TblRefID")::int AS count
  FROM (${DASHBOARD_FEEDER_SUBSTATION_CATALOG_SQL}) v
  GROUP BY v."NetworkHierarchy_Name"
`;

/**
 * `dtrMasterCatalogSql` + `getNetworkDetails` COUNT(*)
 * (`FROM general.M_Network_DTR nd LEFT JOIN L_Network_Lookup n`).
 */
export const DASHBOARD_DTR_CATALOG_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM (
    SELECT
      COALESCE(nd."NetworkLookup_TblRefID", n."NetworkLookup_TblRefID") AS "NetworkLookup_TblRefID",
      COALESCE(nd."OrganisationLookup_TblRefID", n."OrganisationLookup_TblRefID") AS "OrganisationLookup_TblRefID",
      nd."EntryDateTime" AS entry_at
    FROM general."M_Network_DTR" nd
    LEFT JOIN public."L_Network_Lookup" n
      ON n."NetworkLookup_TblRefID" = nd."NetworkLookup_TblRefID"
  ) v
`;

export const DASHBOARD_ACTIVE_DTR_COUNT_SQL = DASHBOARD_DTR_CATALOG_COUNT_SQL;

export const DASHBOARD_ACTIVE_FEEDER_COUNT_SQL = `
  SELECT COUNT(DISTINCT v."NetworkLookup_TblRefID")::int AS count
  FROM (${DASHBOARD_FEEDER_SUBSTATION_CATALOG_SQL}) v
  WHERE v."NetworkHierarchy_Name" = 'Feeder'
`;

export const DASHBOARD_ACTIVE_SUBSTATION_COUNT_SQL = `
  SELECT COUNT(DISTINCT v."NetworkLookup_TblRefID")::int AS count
  FROM (${DASHBOARD_FEEDER_SUBSTATION_CATALOG_SQL}) v
  WHERE v."NetworkHierarchy_Name" = 'Sub Station'
`;

/** Distinct IVRS on the consumer-meter subquery (`totalMeterCount`). */
export const DASHBOARD_ACTIVE_METER_COUNT_SQL = DASHBOARD_SCOPED_CONSUMER_COUNT_SQL;

/**
 * DTR summary `totalDtrs` — `dtrMasterCatalogCountSubquerySql`:
 * active `M_Network_DTR` × DTR-type meters (LEFT JOIN, includes meterless DTRs).
 * Grain is join rows (~1200), not DISTINCT DTR nodes (1070).
 */
export const DASHBOARD_DTR_FLEET_TOTAL_SQL = `
  SELECT COUNT(*)::int AS count
  FROM (
    SELECT
      COALESCE(
        lml."MeterLookup_TblRefID",
        CASE
          WHEN nd."NetworkDTR_TblRefID" IS NOT NULL
          THEN -(1000000000 + nd."NetworkDTR_TblRefID")
          WHEN COALESCE(nd."NetworkLookup_TblRefID", n."NetworkLookup_TblRefID") IS NOT NULL
          THEN -COALESCE(nd."NetworkLookup_TblRefID", n."NetworkLookup_TblRefID")
          ELSE 0
        END
      ) AS "MeterLookup_TblRefID"
    FROM general."M_Network_DTR" nd
    LEFT JOIN public."L_Network_Lookup" n
      ON n."NetworkLookup_TblRefID" = nd."NetworkLookup_TblRefID"
    LEFT JOIN public."L_Meter_Lookup" lml
      ON lml."NetworkLookup_TblRefID" = COALESCE(
        nd."NetworkLookup_TblRefID",
        n."NetworkLookup_TblRefID"
      )
     AND lml."MeterType_TblRefID" = 2
    WHERE nd."IsActiveStatus" = TRUE
  ) v
`;

/** Not used by consumer-metrics harness. */
export const DASHBOARD_DTR_METER_COUNT_SQL = DASHBOARD_DTR_FLEET_TOTAL_SQL;

/**
 * Monitorable DTR meters (Type-2, non-test, active) on active DTRs —
 * last-seen communication path.
 */
export const DASHBOARD_ACTIVE_DTR_METERS_CTE = `
  SELECT DISTINCT meter."MeterLookup_TblRefID" AS meter_id
  FROM general."M_Network_DTR" ml
  INNER JOIN public."L_Meter_Lookup" meter
    ON meter."NetworkLookup_TblRefID" = ml."NetworkDTR_TblRefID"
  WHERE ml."IsActiveStatus" = TRUE
    AND meter."MeterType_TblRefID" = 2
    AND COALESCE(meter."IsTestMeter", FALSE) = FALSE
    AND meter."IsActiveStatus" = TRUE
`;

/**
 * `DashboardRepository.queryDtrCommunicationCountsFromLastSeen` (unscoped).
 * Communicating = meter_last_seen within 15 minutes.
 */
export const DASHBOARD_DTR_COMM_LAST_SEEN_COUNTS_SQL = `
  WITH active_dtr_meters AS (
    ${DASHBOARD_ACTIVE_DTR_METERS_CTE}
  ),
  meter_status AS (
    SELECT
      adm.meter_id,
      COALESCE(mls.last_seen >= NOW() - INTERVAL '15 minutes', FALSE) AS communicating
    FROM active_dtr_meters adm
    LEFT JOIN general.meter_last_seen mls
      ON mls.meter_id = adm.meter_id
  )
  SELECT
    COUNT(*)::int AS total_active_dtr_meters,
    COUNT(*) FILTER (WHERE communicating = TRUE)::int AS communicating_meters,
    COUNT(*) FILTER (WHERE communicating = FALSE)::int AS non_communicating_meters
  FROM meter_status
`;

/** One Type-2 meter per active DTR (lowest meter id) — consumption chart cohort. */
export const DASHBOARD_PREFERRED_DTR_METERS_SQL = `
  SELECT DISTINCT ON (nd."NetworkDTR_TblRefID")
    lml."MeterLookup_TblRefID" AS meter_id
  FROM general."M_Network_DTR" nd
  LEFT JOIN public."L_Network_Lookup" n
    ON n."NetworkLookup_TblRefID" = nd."NetworkLookup_TblRefID"
  INNER JOIN public."L_Meter_Lookup" lml
    ON lml."NetworkLookup_TblRefID" = COALESCE(
      nd."NetworkLookup_TblRefID",
      n."NetworkLookup_TblRefID"
    )
   AND lml."MeterType_TblRefID" = 2
  WHERE nd."IsActiveStatus" = TRUE
    AND lml."IsActiveStatus" = TRUE
    AND COALESCE(lml."IsTestMeter", FALSE) = FALSE
  ORDER BY nd."NetworkDTR_TblRefID" ASC, lml."MeterLookup_TblRefID" ASC
`;

const DASHBOARD_DAILY_CONSUMPTION_CALENDAR_SQL = `
  SELECT
    gs::date AS bucket_sort,
    TO_CHAR(gs::date, 'FMDD Mon') AS bucket_label
  FROM generate_series(
    ((NOW() AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '11 days'),
    (NOW() AT TIME ZONE 'Asia/Kolkata')::date,
    INTERVAL '1 day'
  ) gs
`;

export const DASHBOARD_T_DTR_DAILY_EXISTS_SQL = `
  SELECT to_regclass('public."T_DTR_DAILYData"')::text AS table_name
`;

/**
 * Daily DTR consumption chart — `T_DTR_DAILYData` (preferred Type-2 meter per DTR).
 * Same 12 IST days as `fetchConsumptionTrendCalendar` period=daily.
 */
export const DASHBOARD_DTR_CONSUMPTION_DAILY_PHASE_SQL = `
  WITH preferred AS (
    ${DASHBOARD_PREFERRED_DTR_METERS_SQL}
  ),
  calendar AS (
    ${DASHBOARD_DAILY_CONSUMPTION_CALENDAR_SQL}
  ),
  phase AS (
    SELECT
      t."MeterReading_Date"::date AS bucket_sort,
      COALESCE(ROUND(SUM(t."KWH")::numeric, 2), 0)::float8 AS total_kwh,
      COALESCE(ROUND(SUM(t."KVAH")::numeric, 2), 0)::float8 AS total_kvah,
      COALESCE(ROUND(SUM(t."KVARh")::numeric, 2), 0)::float8 AS total_kvarh
    FROM public."T_DTR_DAILYData" t
    INNER JOIN preferred p ON p.meter_id = t."MeterLookup_TblRefID"
    WHERE t."MeterReading_Date" >= ((NOW() AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '11 days')
    GROUP BY t."MeterReading_Date"::date
  )
  SELECT
    c.bucket_label,
    COALESCE(p.total_kwh, 0)::float8 AS kwh,
    COALESCE(p.total_kvah, 0)::float8 AS kvah,
    COALESCE(p.total_kvarh, 0)::float8 AS kvarh
  FROM calendar c
  LEFT JOIN phase p ON p.bucket_sort = c.bucket_sort
  ORDER BY c.bucket_sort ASC
`;

/** Whether primary-DB consumption rollup tables exist. */
export const DASHBOARD_DTR_CONSUMPTION_ROLLUP_EXISTS_SQL = `
  SELECT to_regclass('general.dtr_consumption_meter_daily')::text AS daily_table,
         to_regclass('general.dtr_consumption_rollup_meta')::text AS meta_table
`;

/**
 * Daily rollup fallback — `fetchDtrConsumptionTrendBucketsFromRollup` (last 11 IST days).
 */
export const DASHBOARD_DTR_CONSUMPTION_DAILY_ROLLUP_SQL = `
  WITH preferred AS (
    ${DASHBOARD_PREFERRED_DTR_METERS_SQL}
  ),
  calendar AS (
    ${DASHBOARD_DAILY_CONSUMPTION_CALENDAR_SQL}
  ),
  dp_daily AS (
    SELECT
      d.reading_day AS bucket_sort,
      COALESCE(ROUND(SUM(d.total_kwh)::numeric, 2), 0)::float8 AS total_kwh,
      COALESCE(ROUND(SUM(d.total_kvah)::numeric, 2), 0)::float8 AS total_kvah,
      0::float8 AS total_kvarh
    FROM general.dtr_consumption_meter_daily d
    INNER JOIN preferred p ON p.meter_id = d.meter_id
    WHERE d.reading_day >= ((NOW() AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '11 days')
    GROUP BY d.reading_day
  )
  SELECT
    c.bucket_label,
    COALESCE(d.total_kwh, 0)::float8 AS kwh,
    COALESCE(d.total_kvah, 0)::float8 AS kvah,
    COALESCE(d.total_kvarh, 0)::float8 AS kvarh
  FROM calendar c
  LEFT JOIN dp_daily d ON d.bucket_sort = c.bucket_sort
  ORDER BY c.bucket_sort ASC
`;

/**
 * `getConsumerMeterStatus` — distinct IVRS, communicating = last_seen in the last IST hour.
 */
export const DASHBOARD_CONSUMER_METER_STATUS_SQL = `
  WITH consumer_rows AS (
    SELECT
      NULLIF(BTRIM(v."RRNumber"), '') AS rr_number,
      BOOL_OR(
        mls.last_seen IS NOT NULL
        AND mls.last_seen >= (NOW() AT TIME ZONE 'Asia/Kolkata') - INTERVAL '1 hour'
        AND mls.last_seen <= (NOW() AT TIME ZONE 'Asia/Kolkata')
      ) AS communicated
    FROM (${DASHBOARD_METER_BASED_CONSUMER_SQL}) v
    LEFT JOIN (
      SELECT DISTINCT ON (meter_id)
        meter_id,
        last_seen
      FROM general.meter_last_seen
      ORDER BY meter_id, last_seen DESC NULLS LAST
    ) mls ON mls.meter_id = v."MeterLookup_TblRefID"
    WHERE NULLIF(BTRIM(v."RRNumber"), '') IS NOT NULL
    GROUP BY NULLIF(BTRIM(v."RRNumber"), '')
  )
  SELECT
    COUNT(*)::int AS total_consumer_meters,
    COUNT(*) FILTER (WHERE communicated IS TRUE)::int AS communicated_consumer_meters,
    COUNT(*) FILTER (WHERE communicated IS NOT TRUE)::int AS non_communicated_consumer_meters
  FROM consumer_rows
`;
