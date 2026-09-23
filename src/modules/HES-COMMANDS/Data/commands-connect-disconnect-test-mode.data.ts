/** GET /indore/commands/settings/connect-disconnect-test-mode */

export const commandsConnectDisconnectTestModeData = {
  expectedSettingKey: "connect_disconnect_test_mode",
  maxResponseTimeMs: 60_000,
} as const;

/** Column headers for GET settings/connect-disconnect-test-mode `data`. */
export const EXPECTED_CONNECT_DISCONNECT_TEST_MODE_COLUMNS = [
  "enabled",
  "settingKey",
  "canUpdate",
] as const;

export const CONNECT_DISCONNECT_TEST_MODE_PATH =
  "/indore/commands/settings/connect-disconnect-test-mode";
