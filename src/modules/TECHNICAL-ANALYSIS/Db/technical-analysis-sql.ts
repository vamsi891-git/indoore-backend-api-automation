/**
 * Read-only SQL for TECHNICAL-ANALYSIS DB cross-validation.
 * Spot-checks report rows against V_Consumerdetails (same view as CONSUMERS /
 * MASTER-DATA). Archive event SQL deferred until backend repository is pasted.
 * Gated by TECHNICAL_ANALYSIS_DB_SQL_READY=true.
 */

/**
 * Resolve consumer identity by RRNumber (IVRS) or Meter_Serial_Number.
 * Params: $1 = ivrsOrMsn
 */
export const TECHNICAL_CONSUMER_BY_IVRS_OR_MSN_SQL = `
  SELECT
    COALESCE(TRIM(v."Consumer_Name"), '') AS "consumerName",
    COALESCE(TRIM(v."Account_ID"), '') AS "accountId",
    COALESCE(TRIM(v."RRNumber"), '') AS "rrNumber",
    COALESCE(TRIM(v."Meter_Serial_Number"), '') AS "meterSerialNumber",
    v."MeterLookup_TblRefID"::int AS "meterLookupTblRefId"
  FROM public."V_Consumerdetails" v
  WHERE TRIM(v."RRNumber") = TRIM($1::text)
     OR TRIM(v."Meter_Serial_Number") = TRIM($1::text)
  ORDER BY v."MeterLookup_TblRefID" ASC
  LIMIT 1
`;

/** Active meters with a consumer service point (universe for soft lte checks). */
export const TECHNICAL_CONSUMER_METER_UNIVERSE_SQL = `
  SELECT COUNT(DISTINCT lml."MeterLookup_TblRefID")::int AS count
  FROM public."L_Meter_Lookup" lml
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."MeterLookup_TblRefID" = lml."MeterLookup_TblRefID"
  WHERE lml."IsActiveStatus" = TRUE
`;

/**
 * TODO: paste technical analysis repository SQL for event/duration aggregates
 * once confirmed against live schema.
 */
export const TECHNICAL_ANALYSIS_SQL_TODO =
  "Event/duration archive SQL deferred — enable after backend repository paste";
