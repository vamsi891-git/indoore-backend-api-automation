export function isRolePermissionsDbSqlReady(): boolean {
  return process.env.ROLE_PERMISSIONS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
