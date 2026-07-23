/**
 * Read-only SQL aligned with MeterReplacementRepository
 * (general.meter_replacement + master-consumer joins).
 * Gated by METER_REPLACEMENT_DB_SQL_READY=true.
 */

/** Backend status tokens (UPPER(status) comparisons). */
export const MR_STATUS_COMPLETED = "COMPLETED";
export const MR_STATUS_PENDING = "PENDING";

/**
 * Master-consumer FROM — mirrors meterReplacementMasterConsumerFromSql usage
 * (active service point + meter join + org for office).
 */
export const MR_MASTER_CONSUMER_FROM_SQL = `
  FROM public."M_Consumer" mc
  INNER JOIN public."M_Consumer_Connection" mcc
    ON mcc."Consumer_TblRefID" = mc."Consumer_TblRefID"
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
   AND COALESCE(sp."IsActive", 0) = 1
  INNER JOIN public."L_Meter_Lookup" lml
    ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
   AND lml."IsActiveStatus" IS TRUE
  LEFT JOIN public."L_Organisation_Lookup" org
    ON org."OrganisationLookup_TblRefID" = mcc."OrganisationLookup_TblRefID"
`;

/**
 * Resolve consumer by Consumer_TblRefID — mirrors findConsumerById.
 * Params: $1 = consumerId
 */
export const MR_CONSUMER_BY_ID_SQL = `
  SELECT
    mc."Consumer_TblRefID"::int AS "consumerId",
    COALESCE(TRIM(mc."Consumer_CID"), '') AS "consumerCid",
    COALESCE(TRIM(mc."Consumer_Name"), '') AS "consumerName",
    COALESCE(TRIM(mcc."RRNumber"), '') AS "rrNumber",
    COALESCE(TRIM(mcc."Account_ID"), '') AS "accountId",
    COALESCE(NULLIF(TRIM(sp."ServicePoint_ID"), ''), '') AS "servicePointId",
    lml."MeterLookup_TblRefID"::int AS "oldMeterLookupId",
    COALESCE(TRIM(lml."Meter_Serial_Number"), '') AS "oldMeterSerial",
    COALESCE(lml."IsActiveStatus", FALSE) AS "meterActive",
    COALESCE(mc."IsActiveStatus", FALSE) AS "consumerActive",
    COALESCE(NULLIF(TRIM(mcc."Zone_Name"), ''), '') AS "zone",
    COALESCE(NULLIF(TRIM(org."Office_Name"), ''), '') AS "office"
  ${MR_MASTER_CONSUMER_FROM_SQL}
  WHERE mc."Consumer_TblRefID" = $1::int
  ORDER BY sp."ConsumerConnection_ServicePoint_TblRefID" DESC
  LIMIT 1
`;

/**
 * New-meter suitability — mirrors findMeterForValidation.
 * Params: $1 = meterSerialNumber
 */
export const MR_METER_BY_SERIAL_SQL = `
  SELECT
    COALESCE(TRIM(ml."Meter_Serial_Number"), '') AS "meterSerialNumber",
    ml."MeterLookup_TblRefID"::int AS "meterLookupTblRefId",
    COALESCE(ml."IsActiveStatus", FALSE) AS "isActive",
    EXISTS (
      SELECT 1
      FROM public."M_Consumer_Connection_ServicePoint" sp
      WHERE sp."MeterLookup_TblRefID" = ml."MeterLookup_TblRefID"
        AND COALESCE(sp."IsActive", 0) = 1
    ) AS "isAssigned"
  FROM public."L_Meter_Lookup" ml
  WHERE TRIM(ml."Meter_Serial_Number") = TRIM($1::text)
  LIMIT 1
`;

/**
 * Dashboard overall KPIs — mirrors getDashboardOverallSummary (unscoped).
 */
export const MR_DASHBOARD_OVERALL_SQL = `
  SELECT
    COUNT(*)::int AS "totalMetersRequested",
    COUNT(*) FILTER (
      WHERE UPPER(status) = '${MR_STATUS_COMPLETED}'
    )::int AS "totalMetersReplaced",
    COUNT(*) FILTER (
      WHERE UPPER(status) = '${MR_STATUS_PENDING}'
    )::int AS "totalPendingMeters",
    COUNT(*) FILTER (
      WHERE is_active IS FALSE
    )::int AS "totalUnmappedMeters"
  FROM general.meter_replacement
`;

/**
 * Submission history universe — mirrors listSubmissionHistory COUNT (no filters).
 */
export const MR_SUBMISSION_HISTORY_COUNT_SQL = `
  SELECT COUNT(*)::int AS count
  FROM general.meter_replacement mr
`;

/**
 * Submission detail identity — mirrors findSubmissionById core columns.
 * Params: $1 = submission id
 */
export const MR_SUBMISSION_BY_ID_SQL = `
  SELECT
    mr.id::int AS "id",
    UPPER(TRIM(mr.status)) AS "status",
    mr.consumer_id::int AS "consumerId",
    COALESCE(TRIM(mr.old_meter_serial), '') AS "oldMeterSerial",
    COALESCE(TRIM(mr.new_meter_serial), '') AS "newMeterSerial",
    mr.old_meter_lookup_id::int AS "oldMeterLookupId",
    mr.new_meter_lookup_id::int AS "newMeterLookupId"
  FROM general.meter_replacement mr
  WHERE mr.id = $1::int
  LIMIT 1
`;

/**
 * My-work / progress — mirrors getDashboardMyWorkSummary / getProgress*.
 * Params: $1 = submitted_by uuid
 */
export const MR_MY_WORK_BY_SUBMITTER_SQL = `
  SELECT
    COUNT(*) FILTER (
      WHERE UPPER(status) = '${MR_STATUS_COMPLETED}'
        AND completed_at IS NOT NULL
        AND completed_at::date = CURRENT_DATE
    )::int AS "completedToday",
    COUNT(*) FILTER (
      WHERE UPPER(status) = '${MR_STATUS_COMPLETED}'
        AND completed_at IS NOT NULL
        AND date_trunc('month', completed_at) = date_trunc('month', CURRENT_TIMESTAMP)
    )::int AS "completedThisMonth",
    COUNT(*) FILTER (
      WHERE UPPER(status) = '${MR_STATUS_COMPLETED}'
    )::int AS "totalCompleted"
  FROM general.meter_replacement
  WHERE submitted_by = $1::uuid
`;

export const MR_PROGRESS_WEEKLY_SUM_SQL = `
  SELECT COUNT(*)::int AS count
  FROM general.meter_replacement mr
  WHERE mr.submitted_by = $1::uuid
    AND UPPER(mr.status) = '${MR_STATUS_COMPLETED}'
    AND mr.completed_at IS NOT NULL
    AND mr.completed_at::date >= (CURRENT_DATE - 6)
    AND mr.completed_at::date <= CURRENT_DATE
`;
