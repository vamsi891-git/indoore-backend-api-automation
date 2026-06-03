// Api/devicemanufacturer.api.ts
import { APIRequestContext, APIResponse } from "@playwright/test";
import { DeviceManufacturerResponse } from "../Mapper/devicemanufacturer.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface DeviceManufacturerApiResponse {
  rawResponse: APIResponse;
  responseBody: DeviceManufacturerResponse;
  responseTime: number;
}
export class DeviceManufacturerApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async getDeviceManufacturers(): Promise<DeviceManufacturerApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/device-manufacturers");
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
