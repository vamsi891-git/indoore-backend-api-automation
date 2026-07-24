export function isModulesPermissionsDbSqlReady(): boolean {
  return process.env.MODULES_PERMISSIONS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
