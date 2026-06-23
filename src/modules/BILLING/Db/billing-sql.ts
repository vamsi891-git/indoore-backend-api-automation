/**
 * Read-only SQL aligned with backend BillingRepository meter header queries.
 * IVRS = mcc."RRNumber"; consumer from M_Consumer (not V_Consumerdetails).
 */

/** listMeterHeadersForSerialsInScope — single normalized serial, active meter only. */
export const BILLING_METER_HEADER_BY_SERIAL_SQL = `
  SELECT DISTINCT ON (n."MeterLookup_TblRefID")
    n."MeterLookup_TblRefID" AS "meterLookupId",
    NULLIF(TRIM(n."Meter_Serial_Number"), '') AS "meterNumber",
    NULLIF(TRIM(mcc."RRNumber"), '') AS "ivrsNumber",
    NULLIF(TRIM(mc."Consumer_Name"), '') AS "consumerName",
    NULLIF(TRIM(mc."Consumer_Address"), '') AS "consumerAddress",
    COALESCE(NULLIF(TRIM(mph."MeterPhase_Name"), ''), NULLIF(TRIM(mph."ShortName"), '')) AS phase,
    mm."MF" AS mf,
    mcc."Sanctioned_Load_KW" AS "sanctionedLoadKw"
  FROM public."L_Meter_Lookup" n
  LEFT JOIN public."M_Meter" mm ON mm."Meter_TblRefID" = n."Meter_TblRefID"
  LEFT JOIN public."L_Network_Lookup" dtr_net
    ON dtr_net."NetworkLookup_TblRefID" = n."NetworkLookup_TblRefID"
  LEFT JOIN public."M_Network_Hierarchy" dtr_h
    ON dtr_h."NetworkHierarchy_TblRefID" = dtr_net."NetworkHierarchy_TblRefID"
  LEFT JOIN public."L_Network_Lookup" parent_net
    ON parent_net."NetworkLookup_TblRefID" = dtr_net."HigherNetwork_ID"
  LEFT JOIN public."M_Network_Hierarchy" parent_h
    ON parent_h."NetworkHierarchy_TblRefID" = parent_net."NetworkHierarchy_TblRefID"
  LEFT JOIN public."L_Network_Lookup" gp_net
    ON gp_net."NetworkLookup_TblRefID" = parent_net."HigherNetwork_ID"
  LEFT JOIN public."M_Network_Hierarchy" gp_h
    ON gp_h."NetworkHierarchy_TblRefID" = gp_net."NetworkHierarchy_TblRefID"
  LEFT JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."MeterLookup_TblRefID" = n."MeterLookup_TblRefID"
    AND (sp."IsActive" IS NULL OR sp."IsActive" = 1)
  LEFT JOIN public."M_Consumer_Connection" mcc
    ON mcc."ConsumerConnection_TblRefID" = sp."ConsumerConnection_TblRefID"
  LEFT JOIN public."M_Consumer" mc ON mc."Consumer_TblRefID" = mcc."Consumer_TblRefID"
  LEFT JOIN public."M_Connection_Category" mccc
    ON mccc."ConnectionCategory_TblRefID" = mcc."ConnectionCategory_TblRefID"
  LEFT JOIN public."M_ServicePoint_MeterPhase" mph
    ON mph."ServicePointMeterPhase_TblRefID" = n."ServicePointMeterPhase_TblRefID"
  WHERE n."IsActiveStatus" IS TRUE
    AND LOWER(TRIM(COALESCE(n."Meter_Serial_Number", ''))) = LOWER(TRIM($1))
  ORDER BY
    n."MeterLookup_TblRefID",
    (CASE WHEN sp."ConsumerConnection_ServicePoint_TblRefID" IS NOT NULL THEN 0 ELSE 1 END) ASC,
    (CASE WHEN NULLIF(TRIM(mcc."CIRCLE"), '') IS NOT NULL THEN 1 ELSE 0 END) DESC,
    mcc."ConsumerConnection_TblRefID" DESC NULLS LAST
  LIMIT 1
`;

/** countBillingClassD3RowsInMonth — archive DB Billing_Class_D3 (no consumer filter). */
export const BILLING_CLASS_D3_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM public."Billing_Class_D3" b
  WHERE date_trunc('month', (b."BillingDate" AT TIME ZONE 'Asia/Kolkata'))::date = $1::date
`;
