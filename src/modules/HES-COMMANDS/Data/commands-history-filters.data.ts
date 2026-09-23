export const COMMANDS_HISTORY_FILTERS_PATH = "/indore/commands/history/filters";

export const commandsHistoryFiltersData = {
  maxResponseTimeMs: 60_000,
} as const;

/** Root keys on GET /indore/commands/history/filters `data`. */
export const EXPECTED_HISTORY_FILTERS_ROOT_KEYS = [
  "commandTypes",
  "commandTypeOptions",
  "commandTypeDisplayNames",
  "statuses",
  "selectionTypes",
] as const;

/** `commandTypes` / option `value` — apiType snake_case (update when catalog changes). */
export const EXPECTED_HISTORY_FILTER_COMMAND_TYPES = [
  "ping",
  "search_meters",
  "relay_status",
  "disconnect",
  "connect",
  "billing_period_get",
  "billing_period_set",
  "demand_integration_period_get",
  "demand_integration_period_set",
  "profile_capture_period_get",
  "profile_capture_period_set",
  "load_curtailment_get",
  "load_curtailment_set",
  "payment_get",
  "last_token_recharge_amount_get",
  "payment_set_prepaid",
  "payment_set_postpaid",
  "payment_recharge_set",
  "metering_mode_get",
  "metering_mode_set_import_export",
  "metering_mode_set_import",
  "max_demand_reset",
  "lrcf_reset",
  "on_demand_profile",
  "tariff_calendar_get",
  "tariff_calendar_set",
  "meter_firmware_upgrade",
] as const;

export const EXPECTED_HISTORY_FILTER_STATUSES = [
  "SUCCESS",
  "FAILED",
  "IN_PROGRESS",
  "QUEUED",
  "REJECTED",
  "PARTIAL",
  "STOPPING",
  "STOPPED",
] as const;

export const EXPECTED_HISTORY_FILTER_SELECTION_TYPES = ["Single", "Bulk"] as const;

export const EXPECTED_HISTORY_FILTER_OPTION_KEYS = [
  "value",
  "label",
  "historyCommandName",
] as const;
