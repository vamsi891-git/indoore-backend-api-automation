import { APIRequestContext, APIResponse } from "@playwright/test";
import { CommandsMeterLookupResponse } from "../Mapper/commands-meter.mapper";
import { buildCommandsMeterPath } from "../Data/commands-meter.data";
export interface CommandsMeterApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsMeterLookupResponse;
  responseTime: number;
}
export class CommandsMeterApi {
  constructor(private request: APIRequestContext) {}
  async getMeterBySerial(serial: string): Promise<CommandsMeterApiResult> {
    const start = Date.now();
    const rawResponse = await this.request.get(
      buildCommandsMeterPath(serial),
    );
    const responseBody = (await rawResponse.json()) as CommandsMeterLookupResponse;
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
