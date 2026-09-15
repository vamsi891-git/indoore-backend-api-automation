/**
 * Read-only SQL for CONSUMERS DB cross-validation.
 * Profile / meter / activation: confirmed against mdms_indore + ConsumersService
 * (validateMeter, updateConsumerActivation, getConsumerProfileInformation).
 * Billing archive count + meter_last_seen + real-time-power IP +
 * power-quality archive IP: pasted from ConsumersRepository.
 * Remaining telemetry widgets deferred (see CONSUMERS_SQL_TODO).
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
 * Latest SP instantaneous row — mirrors ConsumersRepository
 * fetchLatestSpRealTimePowerFromTodayCache (`general.meter_ip_today_sp`).
 * Params: $1 = MeterLookup_TblRefID
 */
export const REALTIME_POWER_SP_LATEST_SQL = `
  SELECT
    "VT_OR_AVG_PH_VT" AS "rVoltage",
    "CUR_OR_AVG_PH_CUR" AS "rCurrent",
    "PW_FACTOR_OR_AVG_INST_PW_FACTOR" AS "rPowerFactor",
    NULL::numeric AS "yVoltage",
    NULL::numeric AS "yCurrent",
    NULL::numeric AS "yPowerFactor",
    NULL::numeric AS "bVoltage",
    NULL::numeric AS "bCurrent",
    NULL::numeric AS "bPowerFactor"
  FROM general.meter_ip_today_sp
  WHERE "MeterLookup_TblRefID" = $1::int
    AND "MeterReading_DateTime" >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date::timestamp
    AND "MeterReading_DateTime" < (
      (NOW() AT TIME ZONE 'Asia/Kolkata')::date + interval '1 day'
    )::timestamp
    AND "MeterReading_DateTime" <= (NOW() AT TIME ZONE 'Asia/Kolkata')
  ORDER BY "MeterReading_DateTime" DESC
  LIMIT 1
`;

/**
 * Latest TP instantaneous row — mirrors ConsumerDetailRepository today cache
 * (`general.meter_ip_today_tp` via upsertMeterIpTodayTpRow / widget cache).
 * Do not scan archive T_IPData_CateTP (full-table ORDER BY hangs).
 * Params: $1 = MeterLookup_TblRefID
 */
export const REALTIME_POWER_TP_LATEST_SQL = `
  SELECT
    "RN_Voltage" AS "rVoltage",
    "R_Current" AS "rCurrent",
    "R_PF" AS "rPowerFactor",
    "YN_Voltage" AS "yVoltage",
    "Y_Current" AS "yCurrent",
    "Y_PF" AS "yPowerFactor",
    "BN_Voltage" AS "bVoltage",
    "B_Current" AS "bCurrent",
    "B_PF" AS "bPowerFactor"
  FROM general.meter_ip_today_tp
  WHERE "MeterLookup_TblRefID" = $1::int
    AND "MeterReading_DateTime" >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date::timestamp
    AND "MeterReading_DateTime" < (
      (NOW() AT TIME ZONE 'Asia/Kolkata')::date + interval '1 day'
    )::timestamp
    AND "MeterReading_DateTime" <= (NOW() AT TIME ZONE 'Asia/Kolkata')
  ORDER BY "MeterReading_DateTime" DESC
  LIMIT 1
`;

/**
 * Latest SP power-quality row — same today cache as
 * awaitConsumerSpTodayIpWidgetCached(..., 'powerQuality').
 * Params: $1 = MeterLookup_TblRefID
 */
export const POWER_QUALITY_SP_LATEST_SQL = `
  SELECT
    "PW_FACTOR_OR_AVG_INST_PW_FACTOR" AS "overallPf",
    "INST_FREQUENCY" AS "frequency",
    "Neutral_Current" AS "neutralCurrent",
    "MD_kW" AS "mdKw",
    "MD_kVA" AS "mdKva"
  FROM general.meter_ip_today_sp
  WHERE "MeterLookup_TblRefID" = $1::int
    AND "MeterReading_DateTime" >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date::timestamp
    AND "MeterReading_DateTime" < (
      (NOW() AT TIME ZONE 'Asia/Kolkata')::date + interval '1 day'
    )::timestamp
    AND "MeterReading_DateTime" <= (NOW() AT TIME ZONE 'Asia/Kolkata')
  ORDER BY "MeterReading_DateTime" DESC
  LIMIT 1
`;

/**
 * Latest TP power-quality row — today cache (neutral always null in API mapping).
 * Params: $1 = MeterLookup_TblRefID
 */
export const POWER_QUALITY_TP_LATEST_SQL = `
  SELECT
    "PF" AS "overallPf",
    "Freq" AS "frequency",
    NULL::numeric AS "neutralCurrent",
    "MD_kW" AS "mdKw",
    "MD_kVA" AS "mdKva"
  FROM general.meter_ip_today_tp
  WHERE "MeterLookup_TblRefID" = $1::int
    AND "MeterReading_DateTime" >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date::timestamp
    AND "MeterReading_DateTime" < (
      (NOW() AT TIME ZONE 'Asia/Kolkata')::date + interval '1 day'
    )::timestamp
    AND "MeterReading_DateTime" <= (NOW() AT TIME ZONE 'Asia/Kolkata')
  ORDER BY "MeterReading_DateTime" DESC
  LIMIT 1
`;

/**
 * TODO — remaining ConsumersRepository archive paste (telemetry-heavy):
 * energy-flow/consumption, event-log, live-load-profile, nearest-account-ids.
 */
export const CONSUMERS_SQL_TODO =
  "Energy-flow / event / live-load / nearest-account SQL deferred until remaining repository queries are pasted";
/**
 * meter_last_seen fallback used by communication-status
 * (ConsumersRepository.fetchMeterLastSeen).
 * Params: $1 = MeterLookup_TblRefID
 */
export const METER_LAST_SEEN_BY_LOOKUP_SQL = `
  SELECT last_seen AS "lastSeen"
  FROM general.meter_last_seen
  WHERE meter_id = $1::int
  LIMIT 1
`;

/**
 * Archive billing-history row count for a meter serial.
 * Mirrors getBillingHistoryRows (SP → Billing_Class_D1, TP → Billing_Class_D3).
 * Params: $1 = meter serial
 */
export const BILLING_HISTORY_ARCHIVE_COUNT_SQL = `
  SELECT GREATEST(
    (
      SELECT COUNT(*)::int
      FROM public."Billing_Class_D1" d1
      WHERE BTRIM(d1."Meter_Serial_Number") = BTRIM($1::text)
    ),
    (
      SELECT COUNT(*)::int
      FROM public."Billing_Class_D3" d3
      WHERE BTRIM(d3."Meter_Serial_Number") = BTRIM($1::text)
    )
  )::int AS total
`;
