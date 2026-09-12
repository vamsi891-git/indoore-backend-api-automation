/**
 * Read-only SQL for MODULES-PERMISSIONS catalog
 * (PermissionsRepository.findAllModulesWithPermissions — unscoped).
 * Gated by MODULES_PERMISSIONS_DB_SQL_READY=true.
 */

export const MODULES_PERMISSIONS_MODULE_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM general.modules
`;

export const MODULES_PERMISSIONS_PERMISSION_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM general.permissions
`;

/**
 * Spot one module + nested permission count.
 * Params: $1 = module id
 */
export const MODULES_PERMISSIONS_MODULE_BY_ID_SQL = `
  SELECT
    m.id::int AS id,
    COALESCE(TRIM(m.key), '') AS key,
    COALESCE(TRIM(m.name), '') AS name,
    COALESCE(m.is_enabled, TRUE) AS "isEnabled",
    (
      SELECT COUNT(*)::int
      FROM general.permissions p
      WHERE p.module_id = m.id
    ) AS "permissionCount"
  FROM general.modules m
  WHERE m.id = $1::int
  LIMIT 1
`;
