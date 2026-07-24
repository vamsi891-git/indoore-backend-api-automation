export function isNotificationsDbSqlReady(): boolean {
  return process.env.NOTIFICATIONS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
