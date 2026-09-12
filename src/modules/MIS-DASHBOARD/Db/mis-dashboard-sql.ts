/**
 * Read-only SQL for MIS-DASHBOARD.
 * Comm-stats live counts: MisDashboardRepository.getCommStatsLive (unscoped).
 * Gated by MIS_DASHBOARD_DB_SQL_READY=true.
 *
 * Omits JWT data-scope — hard rule is API ≤ DB.
 */

/**
 * Unscoped meter universe for live comm-stats cards
 * (excludes test meters; no organisation/network scope).
 */
export const MIS_COMM_STATS_UNSCOPED_SQL = `
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE ml."IsActiveStatus" IS TRUE)::int AS active,
    COUNT(*) FILTER (
      WHERE ml."IsActiveStatus" IS TRUE
        AND COALESCE(mls.last_seen >= NOW() - INTERVAL '15 minutes', FALSE) IS FALSE
    )::int AS "nonOperational",
    COUNT(*) FILTER (WHERE mm.meter_id IS NULL OR mm.network_id IS NULL)::int AS unmapped
  FROM public."L_Meter_Lookup" ml
  LEFT JOIN general.meter_master mm ON mm.meter_id = ml."MeterLookup_TblRefID"
  LEFT JOIN general.meter_last_seen mls ON mls.meter_id = ml."MeterLookup_TblRefID"
  WHERE COALESCE(ml."IsTestMeter", FALSE) = FALSE
`;
