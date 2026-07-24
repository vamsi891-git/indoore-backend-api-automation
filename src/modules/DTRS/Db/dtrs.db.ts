export function isDtrsDbSqlReady(): boolean {
  return process.env.DTRS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
