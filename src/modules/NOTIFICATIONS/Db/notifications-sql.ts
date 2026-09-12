/**
 * Read-only SQL for NOTIFICATIONS inbox (NotificationsRepository).
 * Scoped to JWT user_id — exact API vs DB is safe.
 * Gated by NOTIFICATIONS_DB_SQL_READY=true.
 */

/**
 * Inbox stats triad — mirrors getNotificationStats.
 * Params: $1 = user_id (uuid)
 */
export const NOTIFICATIONS_USER_STATS_SQL = `
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE is_read IS FALSE)::int AS unread,
    COUNT(*) FILTER (WHERE is_read IS TRUE)::int AS read
  FROM general.user_notifications
  WHERE user_id = $1::uuid
`;

/**
 * Spot one notification by id for the same user.
 * Params: $1 = notification id, $2 = user_id
 */
export const NOTIFICATIONS_BY_ID_SQL = `
  SELECT
    id::text AS id,
    user_id::text AS "userId",
    COALESCE(TRIM(title), '') AS title,
    COALESCE(is_read, FALSE) AS "isRead",
    COALESCE(TRIM(notification_type), '') AS "notificationType"
  FROM general.user_notifications
  WHERE id = $1::uuid
    AND user_id = $2::uuid
  LIMIT 1
`;
