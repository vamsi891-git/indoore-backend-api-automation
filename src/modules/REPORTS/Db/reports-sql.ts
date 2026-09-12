/**
 * Read-only SQL for REPORTS DB cross-validation.
 * Event catalog: M_Event (ReportsRepository.findActiveEventTblRefIds / findMEventNamesByIds).
 * Gated by REPORTS_DB_SQL_READY=true.
 */

/** Unscoped active event catalog size. */
export const REPORTS_ACTIVE_EVENT_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM public."M_Event" ev
  WHERE ev."IsActive" IS TRUE
`;

/**
 * Event name spot by id.
 * Params: $1 = Event_TblRefID
 */
export const REPORTS_EVENT_BY_ID_SQL = `
  SELECT
    ev."Event_TblRefID"::int AS "eventId",
    COALESCE(TRIM(ev."Event_Name"), '') AS "eventName",
    COALESCE(ev."IsActive", FALSE) AS "isActive"
  FROM public."M_Event" ev
  WHERE ev."Event_TblRefID" = $1::int
  LIMIT 1
`;
