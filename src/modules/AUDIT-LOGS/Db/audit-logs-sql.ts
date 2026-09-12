/**
 * Read-only SQL aligned with AuditRepository.list
 * (general.audit_logs + actor email enrichment from user_credentials).
 * Gated by AUDIT_LOGS_DB_SQL_READY=true.
 *
 * Count omits JWT actor/target scope — use API total ≤ DB count.
 */

export const AUDIT_LOGS_TOTAL_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM general.audit_logs
`;

/** Spot by primary key. Param $1 = audit log id (uuid). */
export const AUDIT_LOG_BY_ID_SQL = `
  SELECT
    al.id,
    al.actor_id AS "actorId",
    al.target_id AS "targetId",
    al.action,
    al.ip_address AS "ipAddress",
    al.created_at AS "createdAt",
    LOWER(TRIM(uc.email)) AS "actorEmail"
  FROM general.audit_logs al
  LEFT JOIN general.user_credentials uc
    ON uc.id = al.actor_id
  WHERE al.id = $1::uuid
  LIMIT 1
`;
