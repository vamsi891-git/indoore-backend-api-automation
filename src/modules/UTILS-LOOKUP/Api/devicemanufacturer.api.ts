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
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/utils/device-manufacturers",
    );
    const text = await rawResponse.text();
    let responseBody: DeviceManufacturerResponse;
    if (!text.trim()) {
      responseBody = { success: false } as DeviceManufacturerResponse;
    } else {
      try {
        responseBody = JSON.parse(text) as DeviceManufacturerResponse;
      } catch {
        throw new Error(
          `device-manufacturers returned non-JSON (${rawResponse.status()}): ${text.slice(0, 120)}`,
        );
      }
    }
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
