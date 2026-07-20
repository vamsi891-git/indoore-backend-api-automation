/**
 * DB SQL for atr-zone cross-checks against general.aberration_cases
 * (from RevenueProtectionRepository.fetchAtrZoneRows).
 *
 * Year filter uses occurrence_time (same pattern as cases-sql.ts).
 * Verified against live atr-zone totals with RP_ATRZONE_DB_SQL_READY=true.
 *
 * Params: $1 = year text (2026)
 */
export const ATRZONE_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM general.aberration_cases ac
  WHERE EXTRACT(YEAR FROM ac.occurrence_time)::int::text = TRIM($1::text)
`;

/**
 * Spot check by business key. fetchAtrZoneRows does NOT select ac.id —
 * the response's "id" is generated above the repository layer, so it
 * cannot be used to look up the DB row. Match on ivrs + event + billed
 * amount instead, same approach as cases (IVRS alone is not unique).
 * Params: $1 = ivrs, $2 = event_name, $3 = amount_billed
 */
export const ATRZONE_ROW_BY_BUSINESS_KEY_SQL = `
  SELECT
    BTRIM(ac.ivrs_number) AS "ivrs",
    NULLIF(TRIM(ac.event_name), '') AS "eventName",
    COALESCE(ac.amount_billed, 0)::float8 AS "amountBilled",
    COALESCE(ac.amount_realised, 0)::float8 AS "amountRealised",
    NULLIF(TRIM(ac.p4_number), '') AS "p4Number"
  FROM general.aberration_cases ac
  WHERE BTRIM(ac.ivrs_number) = BTRIM($1::text)
    AND TRIM(ac.event_name) = TRIM($2::text)
    AND COALESCE(ac.amount_billed, 0)::float8 = $3::float8
  ORDER BY ac.occurrence_time DESC, ac.created_at DESC
  LIMIT 1
`;