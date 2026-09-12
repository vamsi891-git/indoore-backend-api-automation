/**
 * Read-only SQL aligned with CommercialAnalysisRepository.
 * Gated by COMMERICIAL_ANALYSIS_DB_SQL_READY=true.
 *
 * Detail totals must equal summary.totalCount (same JWT).
 * LF < 5% SQL is `commercialLfLt5SummarySql` on reporting facts (archive).
 */

/** Meter identity grain — same SELECT as fetchMeterDetailsChunk (no scope filter). Param $1 = msn. */
export const COMMERCIAL_METER_BY_MSN_SQL = `
  SELECT
    m."MeterLookup_TblRefID" AS "meterLookupId",
    m."Meter_Serial_Number" AS msn,
    COALESCE(circle_org."Office_Name", '') AS circle,
    COALESCE(div_org."Office_Name", '') AS division,
    COALESCE(subdiv."Office_Name", '') AS "subDivision",
    COALESCE(feeder_net."Network_Name", '') AS feeder,
    COALESCE(dtr_net."Network_Name", '') AS dtr,
    COALESCE(cons."Consumer_Name", '') AS name,
    COALESCE(mcc."RRNumber", '') AS "ivrsNumber",
    COALESCE(cat."ConnectionCategory_Name", '') AS tariff,
    COALESCE(ph."MeterPhase_Name", '') AS phase,
    COALESCE(mcc."Sanctioned_Load_KW", 0)::numeric AS "sanctionLoadKw",
    COALESCE(mcc."Connected_Load_KW", 0)::numeric AS "connectedLoadKw"
  FROM public."L_Meter_Lookup" m
  INNER JOIN public."L_Network_Lookup" n
    ON n."NetworkLookup_TblRefID" = m."NetworkLookup_TblRefID"
  LEFT JOIN public."L_Network_Lookup" dtr_net
    ON dtr_net."NetworkLookup_TblRefID" = m."NetworkLookup_TblRefID"
  LEFT JOIN public."L_Network_Lookup" feeder_net
    ON feeder_net."NetworkLookup_TblRefID" = dtr_net."HigherNetwork_ID"
  LEFT JOIN public."L_Organisation_Lookup" subdiv
    ON subdiv."OrganisationLookup_TblRefID" = m."OrganisationLookup_TblRefID"
  LEFT JOIN public."L_Organisation_Lookup" div_org
    ON div_org."OrganisationLookup_TblRefID" = subdiv."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" circle_org
    ON circle_org."OrganisationLookup_TblRefID" = div_org."HigherOffice_ID"
  LEFT JOIN public."M_ServicePoint_MeterPhase" ph
    ON ph."ServicePointMeterPhase_TblRefID" = m."ServicePointMeterPhase_TblRefID"
  LEFT JOIN LATERAL (
    SELECT
      mcc_inner."Consumer_TblRefID",
      mcc_inner."RRNumber",
      mcc_inner."ConnectionCategory_TblRefID",
      mcc_inner."Sanctioned_Load_KW",
      mcc_inner."Connected_Load_KW"
    FROM public."M_Consumer_Connection_ServicePoint" sp
    INNER JOIN public."M_Consumer_Connection" mcc_inner
      ON mcc_inner."ConsumerConnection_TblRefID" = sp."ConsumerConnection_TblRefID"
    WHERE sp."MeterLookup_TblRefID" = m."MeterLookup_TblRefID"
      AND (sp."IsActive" IS NULL OR sp."IsActive" = 1)
    ORDER BY sp."ConsumerConnection_ServicePoint_TblRefID" DESC
    LIMIT 1
  ) mcc ON TRUE
  LEFT JOIN public."M_Consumer" cons
    ON cons."Consumer_TblRefID" = mcc."Consumer_TblRefID"
  LEFT JOIN public."M_Connection_Category" cat
    ON cat."ConnectionCategory_TblRefID" = mcc."ConnectionCategory_TblRefID"
  WHERE LOWER(TRIM(COALESCE(m."Meter_Serial_Number", ''))) = LOWER(TRIM($1::text))
    AND m."IsActiveStatus" = TRUE
  LIMIT 1
`;

/** Same joins as COMMERCIAL_METER_BY_MSN_SQL. Param $1 = meterLookupId. Includes inactive. */
export const COMMERCIAL_METER_BY_LOOKUP_ID_SQL = `
  SELECT
    m."MeterLookup_TblRefID" AS "meterLookupId",
    m."Meter_Serial_Number" AS msn,
    COALESCE(circle_org."Office_Name", '') AS circle,
    COALESCE(div_org."Office_Name", '') AS division,
    COALESCE(subdiv."Office_Name", '') AS "subDivision",
    COALESCE(feeder_net."Network_Name", '') AS feeder,
    COALESCE(dtr_net."Network_Name", '') AS dtr,
    COALESCE(cons."Consumer_Name", '') AS name,
    COALESCE(mcc."RRNumber", '') AS "ivrsNumber",
    COALESCE(cat."ConnectionCategory_Name", '') AS tariff,
    COALESCE(ph."MeterPhase_Name", '') AS phase,
    COALESCE(mcc."Sanctioned_Load_KW", 0)::numeric AS "sanctionLoadKw",
    COALESCE(mcc."Connected_Load_KW", 0)::numeric AS "connectedLoadKw"
  FROM public."L_Meter_Lookup" m
  INNER JOIN public."L_Network_Lookup" n
    ON n."NetworkLookup_TblRefID" = m."NetworkLookup_TblRefID"
  LEFT JOIN public."L_Network_Lookup" dtr_net
    ON dtr_net."NetworkLookup_TblRefID" = m."NetworkLookup_TblRefID"
  LEFT JOIN public."L_Network_Lookup" feeder_net
    ON feeder_net."NetworkLookup_TblRefID" = dtr_net."HigherNetwork_ID"
  LEFT JOIN public."L_Organisation_Lookup" subdiv
    ON subdiv."OrganisationLookup_TblRefID" = m."OrganisationLookup_TblRefID"
  LEFT JOIN public."L_Organisation_Lookup" div_org
    ON div_org."OrganisationLookup_TblRefID" = subdiv."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" circle_org
    ON circle_org."OrganisationLookup_TblRefID" = div_org."HigherOffice_ID"
  LEFT JOIN public."M_ServicePoint_MeterPhase" ph
    ON ph."ServicePointMeterPhase_TblRefID" = m."ServicePointMeterPhase_TblRefID"
  LEFT JOIN LATERAL (
    SELECT
      mcc_inner."Consumer_TblRefID",
      mcc_inner."RRNumber",
      mcc_inner."ConnectionCategory_TblRefID",
      mcc_inner."Sanctioned_Load_KW",
      mcc_inner."Connected_Load_KW"
    FROM public."M_Consumer_Connection_ServicePoint" sp
    INNER JOIN public."M_Consumer_Connection" mcc_inner
      ON mcc_inner."ConsumerConnection_TblRefID" = sp."ConsumerConnection_TblRefID"
    WHERE sp."MeterLookup_TblRefID" = m."MeterLookup_TblRefID"
      AND (sp."IsActive" IS NULL OR sp."IsActive" = 1)
    ORDER BY sp."ConsumerConnection_ServicePoint_TblRefID" DESC
    LIMIT 1
  ) mcc ON TRUE
  LEFT JOIN public."M_Consumer" cons
    ON cons."Consumer_TblRefID" = mcc."Consumer_TblRefID"
  LEFT JOIN public."M_Connection_Category" cat
    ON cat."ConnectionCategory_TblRefID" = mcc."ConnectionCategory_TblRefID"
  WHERE m."MeterLookup_TblRefID" = $1::int
  LIMIT 1
`;

/** Same joins as COMMERCIAL_METER_BY_MSN_SQL. $1 = msn, $2 = DTR name. Includes inactive. */
export const COMMERCIAL_METER_BY_MSN_AND_DTR_SQL = `
  SELECT
    m."MeterLookup_TblRefID" AS "meterLookupId",
    m."Meter_Serial_Number" AS msn,
    COALESCE(circle_org."Office_Name", '') AS circle,
    COALESCE(div_org."Office_Name", '') AS division,
    COALESCE(subdiv."Office_Name", '') AS "subDivision",
    COALESCE(feeder_net."Network_Name", '') AS feeder,
    COALESCE(dtr_net."Network_Name", '') AS dtr,
    COALESCE(cons."Consumer_Name", '') AS name,
    COALESCE(mcc."RRNumber", '') AS "ivrsNumber",
    COALESCE(cat."ConnectionCategory_Name", '') AS tariff,
    COALESCE(ph."MeterPhase_Name", '') AS phase,
    COALESCE(mcc."Sanctioned_Load_KW", 0)::numeric AS "sanctionLoadKw",
    COALESCE(mcc."Connected_Load_KW", 0)::numeric AS "connectedLoadKw"
  FROM public."L_Meter_Lookup" m
  INNER JOIN public."L_Network_Lookup" n
    ON n."NetworkLookup_TblRefID" = m."NetworkLookup_TblRefID"
  LEFT JOIN public."L_Network_Lookup" dtr_net
    ON dtr_net."NetworkLookup_TblRefID" = m."NetworkLookup_TblRefID"
  LEFT JOIN public."L_Network_Lookup" feeder_net
    ON feeder_net."NetworkLookup_TblRefID" = dtr_net."HigherNetwork_ID"
  LEFT JOIN public."L_Organisation_Lookup" subdiv
    ON subdiv."OrganisationLookup_TblRefID" = m."OrganisationLookup_TblRefID"
  LEFT JOIN public."L_Organisation_Lookup" div_org
    ON div_org."OrganisationLookup_TblRefID" = subdiv."HigherOffice_ID"
  LEFT JOIN public."L_Organisation_Lookup" circle_org
    ON circle_org."OrganisationLookup_TblRefID" = div_org."HigherOffice_ID"
  LEFT JOIN public."M_ServicePoint_MeterPhase" ph
    ON ph."ServicePointMeterPhase_TblRefID" = m."ServicePointMeterPhase_TblRefID"
  LEFT JOIN LATERAL (
    SELECT
      mcc_inner."Consumer_TblRefID",
      mcc_inner."RRNumber",
      mcc_inner."ConnectionCategory_TblRefID",
      mcc_inner."Sanctioned_Load_KW",
      mcc_inner."Connected_Load_KW"
    FROM public."M_Consumer_Connection_ServicePoint" sp
    INNER JOIN public."M_Consumer_Connection" mcc_inner
      ON mcc_inner."ConsumerConnection_TblRefID" = sp."ConsumerConnection_TblRefID"
    WHERE sp."MeterLookup_TblRefID" = m."MeterLookup_TblRefID"
      AND (sp."IsActive" IS NULL OR sp."IsActive" = 1)
    ORDER BY sp."ConsumerConnection_ServicePoint_TblRefID" DESC
    LIMIT 1
  ) mcc ON TRUE
  LEFT JOIN public."M_Consumer" cons
    ON cons."Consumer_TblRefID" = mcc."Consumer_TblRefID"
  LEFT JOIN public."M_Connection_Category" cat
    ON cat."ConnectionCategory_TblRefID" = mcc."ConnectionCategory_TblRefID"
  WHERE (
      LOWER(TRIM(COALESCE(m."Meter_Serial_Number", ''))) = LOWER(TRIM($1::text))
      OR NULLIF(LTRIM(TRIM(COALESCE(m."Meter_Serial_Number", '')), '0'), '')
        = NULLIF(LTRIM(TRIM($1::text), '0'), '')
    )
    AND LOWER(TRIM(COALESCE(dtr_net."Network_Name", ''))) = LOWER(TRIM($2::text))
  LIMIT 1
`;

/**
 * Archive PF violation universe — fetchPfBillingRows full-scan shape
 * (AVG(pf) < threshold over pf > 0 rows).
 * Params: $1 = startDate, $2 = endDate, $3 = threshold (0.8).
 */
export const COMMERCIAL_PF_VIOLATION_COUNT_SQL = `
  WITH billing_raw AS (
    SELECT "Meter_Serial_Number" AS msn, "Billing_Date" AS billing_date,
      "Average_Power_Factor_for_Billing_Period" AS pf,
      "Cumulative_Energy_kWh_for_TZ0" AS kwh,
      "MD_kW_for_TZ0" AS md_kw,
      "Billing_Power_ON_duration_in_Minute" AS billing_minutes
    FROM "Billing_Class_D1"
    WHERE "Billing_Date" >= $1 AND "Billing_Date" < $2
    UNION ALL
    SELECT "Meter_Serial_Number" AS msn, "Billing_Date" AS billing_date,
      "System_Power_Factor_for_Billing_Period_Import" AS pf,
      "Cumulative_Energy_kWh_for_TZ0" AS kwh,
      "MD_kW_for_TZ0" AS md_kw,
      "Billing_Power_ON_duration_in_Minutes" AS billing_minutes
    FROM "Billing_Class_D2"
    WHERE "Billing_Date" >= $1 AND "Billing_Date" < $2
    UNION ALL
    SELECT "Meter_Serial_Number" AS msn, "BillingDate" AS billing_date,
      "PF_Billing_Period" AS pf,
      "Cumulative_Energy_kWh_for_TZ0" AS kwh,
      "MD_kW_for_TZ0" AS md_kw,
      "Billing_Period" AS billing_minutes
    FROM "Billing_Class_D3"
    WHERE "BillingDate" >= $1 AND "BillingDate" < $2
  ),
  billing_all AS (
    SELECT msn, billing_date,
      pf::float8 AS pf, kwh::float8 AS kwh, md_kw::float8 AS md_kw,
      billing_minutes::float8 AS billing_minutes
    FROM billing_raw
  )
  SELECT COUNT(*)::int AS total
  FROM (
    SELECT msn
    FROM billing_all
    WHERE pf IS NOT NULL AND pf > 0
    GROUP BY msn
    HAVING AVG(pf) < $3::float8
  ) t
`;

/**
 * Archive PF for one MSN — same AVG grain as fetchPfBillingRows.
 * Params: $1 = startDate, $2 = endDate, $3 = threshold, $4 = msn.
 */
export const COMMERCIAL_PF_BY_MSN_SQL = `
  WITH billing_raw AS (
    SELECT "Meter_Serial_Number" AS msn, "Billing_Date" AS billing_date,
      "Average_Power_Factor_for_Billing_Period" AS pf
    FROM "Billing_Class_D1"
    WHERE "Billing_Date" >= $1 AND "Billing_Date" < $2
      AND "Meter_Serial_Number" = $4
    UNION ALL
    SELECT "Meter_Serial_Number" AS msn, "Billing_Date" AS billing_date,
      "System_Power_Factor_for_Billing_Period_Import" AS pf
    FROM "Billing_Class_D2"
    WHERE "Billing_Date" >= $1 AND "Billing_Date" < $2
      AND "Meter_Serial_Number" = $4
    UNION ALL
    SELECT "Meter_Serial_Number" AS msn, "BillingDate" AS billing_date,
      "PF_Billing_Period" AS pf
    FROM "Billing_Class_D3"
    WHERE "BillingDate" >= $1 AND "BillingDate" < $2
      AND "Meter_Serial_Number" = $4
  ),
  billing_all AS (
    SELECT msn, pf::float8 AS pf FROM billing_raw
  )
  SELECT msn, AVG(pf)::numeric(5,3) AS pf_value
  FROM billing_all
  WHERE pf IS NOT NULL AND pf > 0
  GROUP BY msn
  HAVING AVG(pf) < $3::float8
  LIMIT 1
`;

/**
 * Archive LF violation universe — mirrors live commercial LF analysis.
 * Duration columns are used as hours (live API grain); do not divide by 60.
 * Params: $1 = startDate, $2 = endDate.
 * Callers must only pass allowlisted operator/threshold (lt|gt + 5|100).
 */
export function buildCommercialLfViolationCountSql(
  operator: "lt" | "gt",
  threshold: 5 | 100,
): string {
  const cond = operator === "lt" ? `< ${threshold}` : `> ${threshold}`;
  const agg = operator === "lt" ? "MIN" : "MAX";
  const lfMdHoursMin = 0.001;
  const lfValueCap = 9999999999.99;
  const lfRow = `(
    CASE
      WHEN md_kw::float8 <= 0::float8 OR billing_minutes::float8 <= 0::float8 THEN NULL::float8
      WHEN (COALESCE(kwh::float8, 0::float8) * 100::float8
            / GREATEST(md_kw::float8 * billing_minutes::float8, ${lfMdHoursMin}::float8)) > ${lfValueCap}::float8
        THEN ${lfValueCap}::float8
      ELSE (COALESCE(kwh::float8, 0::float8) * 100::float8
            / GREATEST(md_kw::float8 * billing_minutes::float8, ${lfMdHoursMin}::float8))
    END
  )::float8`;
  const lfAgg = `CASE
    WHEN ${agg}(lf_row) > ${lfValueCap}::float8 THEN ${lfValueCap}::float8
    ELSE ${agg}(lf_row)
  END::float8`;

  return `
  WITH billing_raw AS (
    SELECT "Meter_Serial_Number" AS msn, "Billing_Date" AS billing_date,
      "Average_Power_Factor_for_Billing_Period" AS pf,
      "Cumulative_Energy_kWh_for_TZ0" AS kwh,
      "MD_kW_for_TZ0" AS md_kw,
      "Billing_Power_ON_duration_in_Minute" AS billing_minutes
    FROM "Billing_Class_D1"
    WHERE "Billing_Date" >= $1 AND "Billing_Date" < $2
    UNION ALL
    SELECT "Meter_Serial_Number" AS msn, "Billing_Date" AS billing_date,
      "System_Power_Factor_for_Billing_Period_Import" AS pf,
      "Cumulative_Energy_kWh_for_TZ0" AS kwh,
      "MD_kW_for_TZ0" AS md_kw,
      "Billing_Power_ON_duration_in_Minutes" AS billing_minutes
    FROM "Billing_Class_D2"
    WHERE "Billing_Date" >= $1 AND "Billing_Date" < $2
    UNION ALL
    SELECT "Meter_Serial_Number" AS msn, "BillingDate" AS billing_date,
      "PF_Billing_Period" AS pf,
      "Cumulative_Energy_kWh_for_TZ0" AS kwh,
      "MD_kW_for_TZ0" AS md_kw,
      "Billing_Period" AS billing_minutes
    FROM "Billing_Class_D3"
    WHERE "BillingDate" >= $1 AND "BillingDate" < $2
  ),
  billing_all AS (
    SELECT msn, billing_date,
      pf::float8 AS pf, kwh::float8 AS kwh, md_kw::float8 AS md_kw,
      billing_minutes::float8 AS billing_minutes
    FROM billing_raw
  ),
  lf_calc AS (
    SELECT msn, ${lfRow} AS lf_row
    FROM billing_all
    WHERE md_kw > 0::float8 AND billing_minutes > 0::float8
  )
  SELECT COUNT(*)::int AS total
  FROM (
    SELECT msn, ${lfAgg} AS lf_value
    FROM lf_calc
    GROUP BY msn
    HAVING ${agg}(lf_row) ${cond}
  ) t
`;
}

/** Same CASE as reports `EXPECTED_BILLING_CLASS_SQL` (`md.phase`). */
const COMMERCIAL_EXPECTED_BILLING_CLASS_SQL = `
  CASE
    WHEN md.phase IS NULL OR btrim(md.phase) = '' THEN NULL
    WHEN lower(regexp_replace(btrim(md.phase), '[[:space:]_-]+', '', 'g')) IN ('ht', 'hightension')
      OR lower(btrim(md.phase)) = 'high tension'
      THEN NULL
    WHEN lower(regexp_replace(btrim(md.phase), '[[:space:]_-]+', '', 'g')) IN ('3ph4ct', '3phct')
      OR lower(regexp_replace(btrim(md.phase), '[[:space:]]+', ' ', 'g')) IN (
        '3ph ct', '3 ph ct', 'three phase 4ct', '3-ph ct'
      )
      OR (
        lower(regexp_replace(btrim(md.phase), '[[:space:]_-]+', '', 'g')) ~ '^3'
        AND lower(regexp_replace(btrim(md.phase), '[[:space:]_-]+', '', 'g')) LIKE '%4ct%'
        AND lower(regexp_replace(btrim(md.phase), '[[:space:]_-]+', '', 'g')) NOT LIKE '%wc%'
      )
      THEN 3
    WHEN lower(regexp_replace(btrim(md.phase), '[[:space:]]+', ' ', 'g')) IN (
        '3ph wc', 'three phase wc', '3-ph wc'
      )
      OR (
        (
          lower(md.phase) LIKE '%three%'
          OR lower(regexp_replace(btrim(md.phase), '[[:space:]_-]+', '', 'g')) ~ '^3'
          OR lower(md.phase) ~ '3[[:space:]_-]*ph'
        )
        AND (
          lower(md.phase) ~ '\\mwc\\M'
          OR lower(regexp_replace(btrim(md.phase), '[[:space:]_-]+', '', 'g')) LIKE '%wc%'
        )
      )
      THEN 2
    WHEN lower(regexp_replace(btrim(md.phase), '[[:space:]_-]+', '', 'g')) IN (
        '1ph', '1phase', 'singlephase'
      )
      OR lower(regexp_replace(btrim(md.phase), '[[:space:]]+', ' ', 'g')) IN (
        'single phase', '1-ph', '1-phase'
      )
      OR lower(regexp_replace(btrim(md.phase), '[[:space:]]+', ' ', 'g')) ~ '^1[[:space:]_-]*(ph|phase)$'
      THEN 1
    ELSE NULL
  END
`;

export const COMMERCIAL_REPORTING_LF_TABLES_EXIST_SQL = `
  SELECT
    to_regclass('reporting.billing_meter_day_fact')::text AS day_fact,
    to_regclass('reporting.meter_dimension_current')::text AS meter_dim
`;

/**
 * `commercialLfLt5SummarySql` — unscoped.
 * Params: $1 = current month start (YYYY-MM-01), $2 = previous month start.
 */
export const COMMERCIAL_LF_LT5_REPORTING_COUNT_SQL = `
  WITH current_boundary AS (
    SELECT
      meter_serial_norm,
      billing_class,
      kwh_tz0,
      md_kw,
      bill_on_min
    FROM reporting.billing_meter_day_fact
    WHERE billing_date_ist = $1::date
      AND billing_class IN (1, 2)
      AND kwh_tz0 IS NOT NULL
      AND md_kw > 0
      AND bill_on_min > 0
  ),
  previous_boundary AS (
    SELECT
      meter_serial_norm,
      billing_class,
      kwh_tz0
    FROM reporting.billing_meter_day_fact
    WHERE billing_date_ist = $2::date
      AND billing_class IN (1, 2)
      AND kwh_tz0 IS NOT NULL
  ),
  billing_pair AS (
    SELECT
      c.meter_serial_norm,
      c.billing_class,
      c.kwh_tz0 AS current_kwh,
      p.kwh_tz0 AS previous_kwh,
      c.md_kw,
      c.bill_on_min
    FROM current_boundary c
    INNER JOIN previous_boundary p
      ON p.meter_serial_norm = c.meter_serial_norm
     AND p.billing_class = c.billing_class
    WHERE c.kwh_tz0 > p.kwh_tz0
  ),
  scoped_meters AS (
    SELECT
      md.meter_lookup_id,
      md.meter_serial_norm,
      md.meter_serial_raw,
      md.ivrs_number,
      md.phase,
      md.sanctioned_load_kw,
      (${COMMERCIAL_EXPECTED_BILLING_CLASS_SQL}) AS expected_billing_class
    FROM reporting.meter_dimension_current md
    WHERE md.is_active IS TRUE
      AND md.asset_kind = 'consumer'
      AND md.meter_serial_norm IS NOT NULL
      AND md.meter_serial_norm <> ''
  ),
  metrics AS (
    SELECT
      sm.meter_lookup_id,
      ROUND(
        (
          ((bp.current_kwh - bp.previous_kwh) / 1000::numeric) * 100.0
        ) / NULLIF(
          GREATEST(
            bp.md_kw / 1000::numeric,
            COALESCE(sm.sanctioned_load_kw, 0::numeric)
          ) * (bp.bill_on_min / 60.0),
          0::numeric
        ),
        2
      ) AS display_lf
    FROM scoped_meters sm
    INNER JOIN billing_pair bp
      ON bp.meter_serial_norm = sm.meter_serial_norm
     AND bp.billing_class = sm.expected_billing_class
  )
  SELECT COUNT(*)::int AS total
  FROM metrics
  WHERE display_lf >= 0.01::numeric
    AND display_lf <= 4.99::numeric
`;

