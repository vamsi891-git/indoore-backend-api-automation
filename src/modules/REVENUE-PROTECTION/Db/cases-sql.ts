/**
 * DB SQL for aberration detail cross-checks against general.aberration_cases
 * (from RevenueProtectionRepository.fetchAberrationDetailRows).
 *
 * Month/year filter expressions in the API use shared SQL helpers
 * (aberrationMonthExpr / aberrationYearExpr). The COUNT below uses
 * occurrence_time as a practical approximation — confirm with backend
 * before setting RP_CASES_DB_SQL_READY=true.
 *
 * Params: $1 = month abbr (JAN), $2 = year text (2026)
 */

export const CASES_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM general.aberration_cases ac
  WHERE UPPER(TO_CHAR(ac.occurrence_time, 'MON')) = UPPER(TRIM($1::text))
    AND EXTRACT(YEAR FROM ac.occurrence_time)::int::text = TRIM($2::text)
`;

/**
 * Spot check by business key. API `id` is a page-local display key, not the UUID.
 * IVRS alone is not unique (multiple cases per meter) — include event + billed amount.
 * Params: $1 = ivrs, $2 = event_name, $3 = amount_billed
 */
export const CASES_ROW_BY_BUSINESS_KEY_SQL = `
  SELECT
    ac.id::text AS id,
    BTRIM(ac.ivrs_number) AS "ivrsNo",
    NULLIF(TRIM(ac.event_name), '') AS event,
    COALESCE(ac.amount_billed, 0)::float8 AS "amountBilled",
    COALESCE(ac.amount_realised, 0)::float8 AS "amountRealisation",
    NULLIF(TRIM(ac.p4_number), '') AS "p4Number",
    NULLIF(TRIM(ac.status), '') AS status
  FROM general.aberration_cases ac
  WHERE BTRIM(ac.ivrs_number) = BTRIM($1::text)
    AND TRIM(ac.event_name) = TRIM($2::text)
    AND COALESCE(ac.amount_billed, 0)::float8 = $3::float8
  ORDER BY ac.occurrence_time DESC, ac.created_at DESC
  LIMIT 1
`;

/**
 * Org hierarchy existence — still needs confirmed master-table names.
 * Keep gated behind RP_CASES_DB_SQL_READY.
 */
export const ORG_HIERARCHY_EXISTS_SQL = `
  SELECT
    ($1::text = '' OR TRUE) AS circle_ok,
    ($2::text = '' OR TRUE) AS division_ok,
    ($3::text = '' OR TRUE) AS zone_ok
`;
