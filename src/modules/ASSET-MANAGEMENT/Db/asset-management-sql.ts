/** Read-only SQL aligned with AssetManagementRepository backend queries. */

export const DTR_METER_COUNT_SQL = `
  SELECT COUNT(DISTINCT lml."MeterLookup_TblRefID")::int AS total
  FROM public."M_Consumer_Connection" mcc
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
  INNER JOIN public."L_Meter_Lookup" lml
    ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
    AND lml."IsActiveStatus" = TRUE
  WHERE mcc."NetworkLookup_TblRefID" = $1
`;

export const ACTIVE_DTR_NETWORK_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM public."L_Network_Lookup" n
  INNER JOIN public."M_Network_Hierarchy" mnh
    ON mnh."NetworkHierarchy_TblRefID" = n."NetworkHierarchy_TblRefID"
  WHERE mnh."NetworkHierarchy_Name" ILIKE '%DTR%'
    AND n."IsActiveStatus" = TRUE
`;

export const DTR_CONSUMER_SPOT_CHECK_SQL = `
  SELECT mc."Consumer_TblRefID" AS "consumerTblRefId",
         mc."Consumer_Name" AS "consumerName",
         mcc."Account_ID" AS "accountId",
         lml."MeterLookup_TblRefID" AS "meterLookupId"
  FROM public."M_Consumer_Connection" mcc
  INNER JOIN public."M_Consumer" mc
    ON mc."Consumer_TblRefID" = mcc."Consumer_TblRefID"
  INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
    ON sp."ConsumerConnection_TblRefID" = mcc."ConsumerConnection_TblRefID"
  INNER JOIN public."L_Meter_Lookup" lml
    ON lml."MeterLookup_TblRefID" = sp."MeterLookup_TblRefID"
    AND lml."IsActiveStatus" = TRUE
  WHERE mcc."NetworkLookup_TblRefID" = $1
    AND mc."Consumer_TblRefID" = $2
  LIMIT 1
`;
