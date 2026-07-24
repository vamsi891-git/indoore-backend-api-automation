export function isReportsDbSqlReady(): boolean {
  return process.env.REPORTS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
