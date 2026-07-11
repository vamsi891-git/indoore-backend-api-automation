import { APIRequestContext, APIResponse } from "@playwright/test";
import { DeviceManufacturerResponse } from "../Mapper/devicemanufacturer.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface DeviceManufacturerApiResponse {
  rawResponse: APIResponse;
  responseBody: DeviceManufacturerResponse;
  responseTime: number;
}

export class DeviceManufacturerApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getDeviceManufacturers(): Promise<DeviceManufacturerApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<DeviceManufacturerResponse>(
        this.authenticatedApi,
        "/indore/utils/device-manufacturers",
        "device-manufacturers",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
