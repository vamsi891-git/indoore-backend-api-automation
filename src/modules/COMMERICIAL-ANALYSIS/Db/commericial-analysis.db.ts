export function isCommericialAnalysisDbSqlReady(): boolean {
  return process.env.COMMERICIAL_ANALYSIS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
