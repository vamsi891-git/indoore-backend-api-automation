/**
 * Soft DB helpers for overall-metrics installationSummary.
 * Gated by OVERALL_DASHBOARD_DB_SQL_READY=true.
 * Endpoint-specific overall-metrics KPI SQL not provided — reuse active meter universe.
 */
export {
  DASHBOARD_ACTIVE_DTR_COUNT_SQL as OD_ACTIVE_DTR_COUNT_SQL,
  DASHBOARD_ACTIVE_FEEDER_COUNT_SQL as OD_ACTIVE_FEEDER_COUNT_SQL,
  DASHBOARD_ACTIVE_SUBSTATION_COUNT_SQL as OD_ACTIVE_SUBSTATION_COUNT_SQL,
  DASHBOARD_ACTIVE_METER_COUNT_SQL as OD_ACTIVE_METER_COUNT_SQL,
} from "../../DASHBOARD/Db/dashboard-sql";
