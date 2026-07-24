export function isUsersProfileImageDbSqlReady(): boolean {
  return process.env.USERS_PROFILE_IMAGE_DB_SQL_READY?.trim().toLowerCase() === "true";
}
