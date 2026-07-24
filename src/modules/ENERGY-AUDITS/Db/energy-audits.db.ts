export function isEnergyAuditsDbSqlReady(): boolean {
  return process.env.ENERGY_AUDITS_DB_SQL_READY?.trim().toLowerCase() === "true";
}
