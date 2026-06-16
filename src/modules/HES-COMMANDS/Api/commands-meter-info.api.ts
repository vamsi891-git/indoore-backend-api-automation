import { APIRequestContext, APIResponse } from "@playwright/test";
import { CommandsMeterInfoResponse } from "../Mapper/commands-meter-info.mapper";
import { buildCommandsMeterInfoPath } from "../Data/commands-meter.data";

export interface CommandsMeterInfoApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsMeterInfoResponse;
  responseTime: number;
}

export class CommandsMeterInfoApi {
  constructor(private request: APIRequestContext) {}

  async getMeterInfo(serial: string): Promise<CommandsMeterInfoApiResult> {
    const start = Date.now();
    const rawResponse = await this.request.get(
      buildCommandsMeterInfoPath(serial),
    );
    const responseBody =
      (await rawResponse.json()) as CommandsMeterInfoResponse;
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
