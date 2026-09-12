/**
 * Read-only SQL aligned with ConsumptionRepository
 * (consumerMasterConnectionSubquerySql + consumerConsumptionCountBaseSql filters).
 * Gated by CONSUMPTION_DB_SQL_READY=true.
 *
 * Count omits JWT data-scope — hard rule is API total ≤ DB count.
 * Daily IR/FR/kWh: archive `T_DPData_CateSP` (fetchReadingsForMeters).
 */

/** Same grain as `consumerMasterConnectionSubquerySql` (shared/sql/consumer-master-sql.ts). */
const CONSUMER_MASTER_CONNECTION_SUBQUERY = `
  SELECT
    mc."Consumer_Name",
    mcc."RRNumber",
    lml."Meter_Serial_Number",
    lml."IsActiveStatus",
    lml."MeterLookup_TblRefID",
    lml."ServicePointMeterPhase_TblRefID",
    mcc."ConsumerConnection_TblRefID",
    mcc."OrganisationLookup_TblRefID",
    mcc."NetworkLookup_TblRefID",
    mccc."Category_TblRefID",
    lml.isnetmeter,
    mpp."ShortName" AS "Phase"
  FROM public."L_Meter_Lookup" lml
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."MeterLookup_TblRefID" = lml."MeterLookup_TblRefID"
  INNER JOIN public."M_Consumer_Connection" mcc
    ON mcc."ConsumerConnection_TblRefID" = sp."ConsumerConnection_TblRefID"
  INNER JOIN public."M_Consumer" mc
    ON mc."Consumer_TblRefID" = mcc."Consumer_TblRefID"
  INNER JOIN public."M_Connection_Category" mccc
    ON mccc."ConnectionCategory_TblRefID" = mcc."ConnectionCategory_TblRefID"
  INNER JOIN public."M_ServicePoint_MeterPhase" mpp
    ON mpp."ServicePointMeterPhase_TblRefID" = lml."ServicePointMeterPhase_TblRefID"
  INNER JOIN public."M_Connection_Status" mcs
    ON mcs."ConnectionStatus_TblRefID" = mcc."ConnectionStatus_TblRefID"
  WHERE lml."IsActiveStatus" IS TRUE
`;

/**
 * Unscoped consumption list total —
 * COUNT(*) FROM consumerConsumptionCountBaseSql WHERE IsActiveStatus IS TRUE.
 */
export const CONSUMPTION_ACTIVE_CONSUMER_METER_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM (
    ${CONSUMER_MASTER_CONNECTION_SUBQUERY}
  ) AS v
  WHERE v."IsActiveStatus" IS TRUE
`;

/**
 * Unscoped pattern / monthly list COUNT grain —
 * mirrors ConsumptionRepository `consumptionPageKeyFromSql` (no JWT / filters).
 * Used for pattern-consumption `table.pagination.totalCount` match.
 */
export const CONSUMPTION_LIST_PAGE_KEY_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM public."M_Consumer_Connection" mcc
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
    AND sp."IsActive" = 1
  INNER JOIN public."L_Meter_Lookup" lml
    ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
    AND lml."IsActiveStatus" IS TRUE
`;

/** Unscoped net-meter list universe — `lml.isnetmeter IS TRUE` (monthly-net-meter). */
export const CONSUMPTION_ACTIVE_NET_METER_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM (
    ${CONSUMER_MASTER_CONNECTION_SUBQUERY}
  ) AS v
  WHERE v."IsActiveStatus" IS TRUE
    AND v.isnetmeter IS TRUE
`;

/**
 * Spot identity by meter serial — same master subquery + ShortName phase
 * (consumerDailyConsumptionBaseSql projects mph."ShortName" AS "Phase").
 * Param $1 = msn, $2 = optional IVRS (empty = first msn match).
 * Duplicate serials: prefer the connection whose RRNumber matches the API IVRS.
 */
export const CONSUMPTION_CONSUMER_BY_MSN_SQL = `
  SELECT
    COALESCE(v."Consumer_Name", '') AS name,
    COALESCE(v."RRNumber", '') AS "ivrsNumber",
    COALESCE(NULLIF(TRIM(v."Meter_Serial_Number"), ''), '') AS msn,
    COALESCE(v."Phase", '') AS phase,
    v."MeterLookup_TblRefID"::int AS "meterLookupTblRefId"
  FROM (
    ${CONSUMER_MASTER_CONNECTION_SUBQUERY}
  ) AS v
  WHERE v."IsActiveStatus" IS TRUE
    AND LOWER(TRIM(COALESCE(v."Meter_Serial_Number", ''))) = LOWER(TRIM($1::text))
    AND (
      LENGTH(TRIM(COALESCE($2::text, ''))) = 0
      OR LOWER(REGEXP_REPLACE(TRIM(COALESCE(v."RRNumber", '')), '^n', '', 'i'))
         = LOWER(REGEXP_REPLACE(TRIM($2::text), '^n', '', 'i'))
    )
  ORDER BY v."Consumer_Name" ASC NULLS LAST, v."RRNumber" ASC NULLS LAST
  LIMIT 1
`;

/**
 * Daily IR/FR aggregate — mirrors ConsumptionRepository.fetchReadingData
 * on archive `T_DPData_CateSP` (kWh_Imp_Cumu / Meter_TimeStamp).
 * Params: $1 = meterLookupId, $2 = fromDate (YYYY-MM-DD), $3 = toDate (YYYY-MM-DD).
 */
export const CONSUMPTION_DAILY_READING_AGG_SQL = `
  WITH ranged AS (
    SELECT
      t."MeterLookup_TblRefID",
      t."Meter_TimeStamp" AS reading_ts,
      t."kWh_Imp_Cumu" AS reading_val,
      ROW_NUMBER() OVER (
        PARTITION BY t."MeterLookup_TblRefID"
        ORDER BY t."Meter_TimeStamp" ASC
      ) AS rn_asc,
      ROW_NUMBER() OVER (
        PARTITION BY t."MeterLookup_TblRefID"
        ORDER BY t."Meter_TimeStamp" DESC
      ) AS rn_desc
    FROM public."T_DPData_CateSP" t
    WHERE t."MeterLookup_TblRefID" = $1::int
      AND t."Meter_TimeStamp" >= $2::date
      AND t."Meter_TimeStamp" < ($3::date + INTERVAL '1 day')
      AND t."kWh_Imp_Cumu" IS NOT NULL
  )
  SELECT
    r."MeterLookup_TblRefID"::int AS "meterLookupTblRefId",
    MAX(CASE WHEN r.rn_asc = 1 THEN r.reading_ts END) AS "minDate",
    MAX(CASE WHEN r.rn_desc = 1 THEN r.reading_ts END) AS "maxDate",
    MAX(CASE WHEN r.rn_asc = 1 THEN r.reading_val END) AS ir,
    MAX(CASE WHEN r.rn_desc = 1 THEN r.reading_val END) AS fr
  FROM ranged r
  GROUP BY r."MeterLookup_TblRefID"
`;
