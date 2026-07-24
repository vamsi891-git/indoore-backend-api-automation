export function isConsumptionDbSqlReady(): boolean {
  return process.env.CONSUMPTION_DB_SQL_READY?.trim().toLowerCase() === "true";
}
