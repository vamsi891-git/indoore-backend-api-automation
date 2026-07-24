/**
 * Read-only SQL aligned with backend AuthRepository (general.* auth tables).
 * Gated by AUTH_DB_SQL_READY=true. Never selects password_hash / token_hash.
 */

/** findUserById / mapUser grain for GET /auth/me spot checks. */
export const AUTH_USER_BY_ID_SQL = `
  SELECT
    uc.id AS id,
    LOWER(TRIM(uc.email)) AS email,
    COALESCE(uc.status, 'active') AS status,
    r.name AS role_name,
    r.sort_order AS role_sort_order,
    up.first_name AS first_name,
    up.last_name AS last_name,
    up.scope_organisation_lookup_id AS organisation_lookup_id,
    up.scope_network_lookup_id AS network_lookup_id,
    up.consumer_id AS consumer_id,
    up.scope_consumer_tbl_ref_id AS consumer_tbl_ref_id,
    uls.failed_login_attempts AS failed_login_attempts
  FROM general.user_credentials uc
  INNER JOIN general.roles r
    ON r.id = uc.role_id
  LEFT JOIN general.user_profiles up
    ON up.user_id = uc.id
  LEFT JOIN general.user_login_security uls
    ON uls.user_id = uc.id
  WHERE uc.id = $1::uuid
  LIMIT 1
`;

/** countActiveAuthDevicesForUser */
export const AUTH_ACTIVE_DEVICES_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM general.auth_devices
  WHERE user_id = $1::uuid
    AND revoked_at IS NULL
`;

/** listAuthDevicesForUser spot by device id */
export const AUTH_ACTIVE_DEVICE_BY_ID_SQL = `
  SELECT
    id,
    user_id,
    name,
    device_type,
    browser,
    os,
    last_ip_address,
    last_location_text,
    revoked_at
  FROM general.auth_devices
  WHERE id = $1::uuid
    AND user_id = $2::uuid
    AND revoked_at IS NULL
  LIMIT 1
`;

/**
 * countSentInvitationsSummary — totals for invitations sent by this user.
 * Param $1 = invited_by_user_id.
 */
export const AUTH_INVITATION_SUMMARY_SQL = `
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE used_at IS NOT NULL)::int AS accepted_count,
    COUNT(*) FILTER (
      WHERE used_at IS NULL AND expires_at > NOW()
    )::int AS pending_count,
    COUNT(*) FILTER (
      WHERE used_at IS NULL AND expires_at <= NOW()
    )::int AS expired_count
  FROM general.user_invitations
  WHERE invited_by_user_id = $1::uuid
`;

/** listActiveSessionFamiliesOldestFirst grain — distinct active families. */
export const AUTH_ACTIVE_SESSION_FAMILY_COUNT_SQL = `
  SELECT COUNT(DISTINCT family_id)::int AS total
  FROM general.refresh_tokens
  WHERE user_id = $1::uuid
    AND revoked = false
    AND expires_at > NOW()
`;
