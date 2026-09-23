import { APIRequestContext, APIResponse } from "@playwright/test";
import { CONNECT_DISCONNECT_TEST_MODE_PATH } from "../Data/commands-connect-disconnect-test-mode.data";
import { ConnectDisconnectTestModeResponse } from "../Mapper/commands-connect-disconnect-test-mode.mapper";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsConnectDisconnectTestModeApiResult {
  rawResponse: APIResponse;
  responseBody: ConnectDisconnectTestModeResponse;
  responseTime: number;
}

export class CommandsConnectDisconnectTestModeApi {
  constructor(private request: APIRequestContext) {}

  async getTestMode(): Promise<CommandsConnectDisconnectTestModeApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      CONNECT_DISCONNECT_TEST_MODE_PATH,
    );
    const responseBody =
      await parseCommandsResponseBody<ConnectDisconnectTestModeResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
