/**
 * Read-only SQL for CONSUMERS DB cross-validation.
 * Profile / meter / activation: confirmed against mdms_indore + ConsumersService
 * (validateMeter, updateConsumerActivation, getConsumerProfileInformation).
 * Archive widgets still need ConsumersRepository SQL paste.
 * Gated by CONSUMERS_DB_SQL_READY=true.
 */

/**
 * Resolve consumer identity by Account_ID or RRNumber (IVRS).
 * Params: $1 = accountOrIvrs
 */
export const CONSUMER_PROFILE_BY_REF_SQL = `
  SELECT
    COALESCE(TRIM(v."Consumer_Name"), '') AS "consumerName",
    COALESCE(TRIM(v."Account_ID"), '') AS "accountId",
    COALESCE(TRIM(v."RRNumber"), '') AS "rrNumber",
    COALESCE(TRIM(v."Meter_Serial_Number"), '') AS "meterSerialNumber",
    COALESCE(TRIM(v."Consumer_Email"), '') AS "consumerEmail",
    v."Sanctioned_Load_KW" AS "sanctionedLoadKw",
    v."MeterLookup_TblRefID"::int AS "meterLookupTblRefId"
  FROM public."V_Consumerdetails" v
  WHERE TRIM(v."Account_ID") = TRIM($1::text)
     OR TRIM(v."RRNumber") = TRIM($1::text)
  ORDER BY v."MeterLookup_TblRefID" ASC
  LIMIT 1
`;

/**
 * Activation status — mirrors ConsumersService.updateConsumerActivation /
 * isActiveToConsumerActivation (M_Consumer.IsActiveStatus).
 * Params: $1 = accountId / IVRS / consumer CID
 */
export const CONSUMER_ACTIVATION_BY_REF_SQL = `
  SELECT
    mc."Consumer_TblRefID"::int AS "consumerTblRefId",
    COALESCE(TRIM(mcc."Account_ID"), '') AS "accountId",
    COALESCE(TRIM(mcc."RRNumber"), '') AS "rrNumber",
    COALESCE(TRIM(mc."Consumer_Name"), '') AS "consumerName",
    COALESCE(mc."IsActiveStatus", FALSE) AS "isActive"
  FROM public."M_Consumer" mc
  INNER JOIN public."M_Consumer_Connection" mcc
    ON mcc."Consumer_TblRefID" = mc."Consumer_TblRefID"
  WHERE TRIM(mcc."Account_ID") = TRIM($1::text)
     OR TRIM(mcc."RRNumber") = TRIM($1::text)
  ORDER BY mc."Consumer_TblRefID" ASC
  LIMIT 1
`;

/** Active consumer-connection rows (universe for soft count checks). */
export const CONSUMER_CONNECTION_COUNT_SQL = `
  SELECT COUNT(DISTINCT mcc."Account_ID")::int AS count
  FROM public."M_Consumer_Connection" mcc
  WHERE NULLIF(TRIM(mcc."Account_ID"), '') IS NOT NULL
`;

/**
 * Meter serial for validate-meter — mirrors ConsumersService.validateMeter /
 * findMeterBySerialWithoutScope + service-point assignment check.
 * Params: $1 = meterSerialNumber
 */
export const METER_BY_SERIAL_SQL = `
  SELECT
    COALESCE(TRIM(lml."Meter_Serial_Number"), '') AS "meterSerialNumber",
    lml."MeterLookup_TblRefID"::int AS "meterLookupTblRefId",
    COALESCE(lml."IsActiveStatus", FALSE) AS "isActive",
    EXISTS (
      SELECT 1
      FROM public."M_Consumer_Connection_ServicePoint" sp
      WHERE sp."MeterLookup_TblRefID" = lml."MeterLookup_TblRefID"
    ) AS "isAssigned"
  FROM public."L_Meter_Lookup" lml
  WHERE TRIM(lml."Meter_Serial_Number") = TRIM($1::text)
  LIMIT 1
`;

/**
 * TODO — paste ConsumersRepository SQL for:
 * communication-status, billing-history, energy-flow/consumption,
 * event-log, power-quality, live-load-profile, nearest-account-ids,
 * isMeterLinkedAsDtrAsset.
 */
export const CONSUMERS_SQL_TODO =
  "Archive / telemetry / nearest-account SQL deferred until ConsumersRepository queries are pasted";
