/**
 * DB SQL for aberration-entry cross-checks against general.aberration_cases
 * (from RevenueProtectionRepository.fetchAberrationEntryRows).
 *
 * Month/year filters are optional on the API. Params are nullable — when
 * $1 or $2 is NULL the corresponding filter is skipped.
 *
 * Params: $1 = month name/abbr or NULL, $2 = year text or NULL, $3 = case_level (ZONE_OFFICE | EENLMT)
 */
export const ABERRATION_ENTRY_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM general.aberration_cases ac
  WHERE ($1::text IS NULL OR TRIM(TO_CHAR(ac.occurrence_time, 'FMMonth')) ILIKE TRIM($1::text))
    AND ($2::text IS NULL OR EXTRACT(YEAR FROM ac.occurrence_time)::int::text = TRIM($2::text))
    AND ($3::text IS NULL OR ac.case_level = $3::text)
`;

/**
 * Spot check by business key. API \`id\` is not a stable DB UUID for lookup.
 * Match on ivrs + event + billed amount (IVRS alone is not unique).
 * Params: $1 = ivrs, $2 = event_name, $3 = amount_billed, $4 = case_level or NULL
 */
export const ABERRATION_ENTRY_ROW_BY_BUSINESS_KEY_SQL = `
  SELECT
    BTRIM(ac.ivrs_number) AS "ivrs",
    NULLIF(TRIM(ac.event_name), '') AS "eventName",
    COALESCE(ac.amount_billed, 0)::float8 AS "amountBilled",
    COALESCE(ac.amount_realised, 0)::float8 AS "amountRealised",
    NULLIF(TRIM(ac.observation_remarks), '') AS "remarks",
    NULLIF(TRIM(ac.investigation_remarks), '') AS "fieldOfficerRemarks",
    NULLIF(TRIM(ac.field_officer_name), '') AS "fieldOfficerName",
    NULLIF(TRIM(ac.field_officer_designation), '') AS "fieldOfficerDesignation",
    NULLIF(TRIM(ac.mr_transaction_number), '') AS "mrTransactionNo",
    NULLIF(TRIM(ac.p4_number), '') AS "p4No"
  FROM general.aberration_cases ac
  WHERE BTRIM(ac.ivrs_number) = BTRIM($1::text)
    AND TRIM(ac.event_name) = TRIM($2::text)
    AND COALESCE(ac.amount_billed, 0)::float8 = $3::float8
    AND ($4::text IS NULL OR ac.case_level = $4::text)
  ORDER BY ac.occurrence_time DESC, ac.created_at DESC
  LIMIT 1
`;

/**
 * Existence check for by-IVRS lookup (findAberrationEntryUuidByIvrs).
 * Params: $1 = ivrs
 */
export const ABERRATION_ENTRY_EXISTS_BY_IVRS_SQL = `
  SELECT COUNT(*)::int AS count
  FROM general.aberration_cases ac
  WHERE BTRIM(ac.ivrs_number) = BTRIM($1::text)
`;

/**
 * Latest editable-style row for an IVRS (post-PATCH spot check).
 * Params: $1 = ivrs
 */
export const ABERRATION_ENTRY_LATEST_BY_IVRS_SQL = `
  SELECT
    BTRIM(ac.ivrs_number) AS "ivrs",
    NULLIF(TRIM(ac.event_name), '') AS "eventName",
    COALESCE(ac.amount_billed, 0)::float8 AS "amountBilled",
    COALESCE(ac.amount_realised, 0)::float8 AS "amountRealised",
    NULLIF(TRIM(ac.observation_remarks), '') AS "remarks",
    NULLIF(TRIM(ac.investigation_remarks), '') AS "fieldOfficerRemarks",
    NULLIF(TRIM(ac.field_officer_name), '') AS "fieldOfficerName",
    NULLIF(TRIM(ac.field_officer_designation), '') AS "fieldOfficerDesignation",
    NULLIF(TRIM(ac.mr_transaction_number), '') AS "mrTransactionNo",
    NULLIF(TRIM(ac.p4_number), '') AS "p4No"
  FROM general.aberration_cases ac
  WHERE BTRIM(ac.ivrs_number) = BTRIM($1::text)
  ORDER BY ac.updated_at DESC NULLS LAST, ac.occurrence_time DESC, ac.created_at DESC
  LIMIT 1
`;
