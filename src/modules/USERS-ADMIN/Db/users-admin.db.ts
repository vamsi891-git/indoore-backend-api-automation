export function isUsersAdminDbSqlReady(): boolean {
  return process.env.USERS_ADMIN_DB_SQL_READY?.trim().toLowerCase() === "true";
}
