export function isMisDashboardDbSqlReady(): boolean {
  return process.env.MIS_DASHBOARD_DB_SQL_READY?.trim().toLowerCase() === "true";
}
