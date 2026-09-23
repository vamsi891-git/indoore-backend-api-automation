import { expect } from "@playwright/test";
import {
  EXPECTED_CONNECT_DISCONNECT_TEST_MODE_COLUMNS,
  commandsConnectDisconnectTestModeData,
} from "../Data/commands-connect-disconnect-test-mode.data";
import {
  ConnectDisconnectTestModeResponse,
  MappedConnectDisconnectTestModeData,
} from "../Mapper/commands-connect-disconnect-test-mode.mapper";

export class CommandsConnectDisconnectTestModeValidator {
  validateResponse(body: ConnectDisconnectTestModeResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  }

  validateErrorResponse(body: ConnectDisconnectTestModeResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateDataKeys(data: object): void {
    expect(Object.keys(data).sort()).toEqual(
      [...EXPECTED_CONNECT_DISCONNECT_TEST_MODE_COLUMNS].sort(),
    );
  }

  validateSettingKey(mapped: MappedConnectDisconnectTestModeData): void {
    expect(mapped.settingKey).toBe(commandsConnectDisconnectTestModeData.expectedSettingKey);
  }

  validateFlags(mapped: MappedConnectDisconnectTestModeData): void {
    expect(typeof mapped.enabled).toBe("boolean");
    expect(typeof mapped.canUpdate).toBe("boolean");
  }

  validateFullContract(mapped: MappedConnectDisconnectTestModeData, rawData?: object): void {
    if (rawData) {
      this.validateDataKeys(rawData);
    }
    this.validateSettingKey(mapped);
    this.validateFlags(mapped);
  }
}
