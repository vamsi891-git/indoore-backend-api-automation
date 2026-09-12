/**
 * Read-only SQL aligned with CommandsRepository.getCommandsHistory
 * (general.hes_command_logs). Gated by HES_COMMANDS_DB_SQL_READY=true.
 * Never selects hes_response blobs beyond a presence check.
 */

/** Unscoped history universe — matches API totalRecords when no filters. */
export const HES_COMMAND_LOGS_COUNT_SQL = `
  SELECT COUNT(*)::int AS total
  FROM general.hes_command_logs
`;

/**
 * Spot row by request_id + selected meter (bulk jobs share request_id).
 * Params: $1 = request_id, $2 = selected meter serial
 */
export const HES_COMMAND_LOG_SPOT_SQL = `
  SELECT
    h.id AS id,
    COALESCE(TRIM(h.request_id), '') AS request_id,
    COALESCE(TRIM(h.command_name), '') AS command_name,
    COALESCE(TRIM(h.selected), '') AS selected,
    COALESCE(TRIM(h.selection_type), '') AS selection_type,
    COALESCE(TRIM(h.status), '') AS status,
    NULLIF(TRIM(h.error_message), '') AS error_message
  FROM general.hes_command_logs h
  WHERE TRIM(COALESCE(h.request_id, '')) = TRIM($1::text)
    AND TRIM(COALESCE(h.selected, '')) = TRIM($2::text)
  ORDER BY h.id DESC
  LIMIT 1
`;
