export function isHesCommandsDbSqlReady(): boolean {
  return process.env.HES_COMMANDS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
