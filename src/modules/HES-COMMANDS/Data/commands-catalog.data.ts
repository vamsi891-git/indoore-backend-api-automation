export const COMMANDS_CATALOG_PATH = "/indore/commands/catalog";

export const commandsCatalogData = {
  maxResponseTimeMs: 60_000,
} as const;

/** Root keys on GET /indore/commands/catalog `data`. */
export const EXPECTED_COMMANDS_CATALOG_ROOT_KEYS = [
  "classifications",
  "commandTypes",
  "commandDataExamples",
] as const;

/** Classification keys from live catalog (update when API adds/removes groups). */
export const EXPECTED_CATALOG_CLASSIFICATION_KEYS = [
  "general",
  "disconnector-control",
  "billing-period",
  "demand-integration-period",
  "profile-capture-period",
  "load-curtailment",
  "payment",
  "metering-mode",
  "reset",
  "on-demand",
  "tariff-calendar",
  "firmware",
] as const;

/** Command type keys from live catalog (update when API adds/removes commands). */
export const EXPECTED_CATALOG_COMMAND_TYPE_KEYS = [
  "ping",
  "search-meters",
  "relay-status",
  "disconnect",
  "connect",
  "billing-period-get",
  "billing-period-set",
  "demand-integration-period-get",
  "demand-integration-period-set",
  "profile-capture-period-get",
  "profile-capture-period-set",
  "load-curtailment-get",
  "load-curtailment-set",
  "payment-get",
  "last-token-recharge-amount-get",
  "payment-set-prepaid",
  "payment-set-postpaid",
  "payment-recharge-set",
  "metering-mode-get",
  "metering-mode-set-import-export",
  "metering-mode-set-import",
  "max-demand-reset",
  "lrcf-reset",
  "on-demand-profile",
  "tariff-calendar-get",
  "tariff-calendar-set",
  "meter-firmware-upgrade",
] as const;

/** Keys that must appear under `commandDataExamples`. */
export const EXPECTED_CATALOG_EXAMPLE_KEYS = [
  "billing-period-set",
  "demand-integration-period-set",
  "profile-capture-period-set",
  "load-curtailment-set",
  "payment-set-prepaid",
  "payment-set-postpaid",
  "payment-recharge-set",
  "metering-mode-set-import-export",
  "metering-mode-set-import",
  "tariff-calendar-set",
  "on-demand-profile",
] as const;

/** Command types that require step-up auth. */
export const EXPECTED_REQUIRES_STEP_UP_KEYS = [
  "disconnect",
  "connect",
  "billing-period-set",
  "demand-integration-period-set",
  "profile-capture-period-set",
  "load-curtailment-set",
  "payment-set-prepaid",
  "payment-set-postpaid",
  "payment-recharge-set",
  "metering-mode-set-import-export",
  "metering-mode-set-import",
  "max-demand-reset",
  "lrcf-reset",
  "tariff-calendar-set",
  "meter-firmware-upgrade",
] as const;

export const EXPECTED_CLASSIFICATION_ITEM_KEYS = ["key", "label"] as const;

export const EXPECTED_COMMAND_TYPE_ITEM_KEYS = [
  "key",
  "label",
  "classificationKey",
  "apiType",
  "endpoint",
  "historyCommandName",
] as const;
