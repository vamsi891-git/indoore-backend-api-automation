export function isAuditLogsDbSqlReady(): boolean {
  return process.env.AUDIT_LOGS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
