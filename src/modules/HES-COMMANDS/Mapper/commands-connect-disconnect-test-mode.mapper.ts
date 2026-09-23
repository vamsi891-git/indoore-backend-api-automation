export interface ConnectDisconnectTestModeData {
  enabled: boolean;
  settingKey: string;
  canUpdate: boolean;
}

export interface ConnectDisconnectTestModeResponse {
  success: boolean;
  data?: ConnectDisconnectTestModeData;
  message?: string;
  error?: { code?: string; message?: string };
}

export interface MappedConnectDisconnectTestModeData {
  enabled: boolean;
  settingKey: string;
  canUpdate: boolean;
}

export class CommandsConnectDisconnectTestModeMapper {
  static mapResponse(body: ConnectDisconnectTestModeResponse): MappedConnectDisconnectTestModeData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful connect-disconnect-test-mode response");
    }

    return {
      enabled: Boolean(body.data.enabled),
      settingKey: String(body.data.settingKey ?? "").trim(),
      canUpdate: Boolean(body.data.canUpdate),
    };
  }
}
