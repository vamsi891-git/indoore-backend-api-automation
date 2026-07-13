import { APIRequestContext, APIResponse } from "@playwright/test";
import { DeviceManufacturerResponse } from "../Mapper/devicemanufacturer.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface DeviceManufacturerApiResponse {
  rawResponse: APIResponse;
  responseBody: DeviceManufacturerResponse;
  responseTime: number;
}

export class DeviceManufacturerApi {
  static readonly PATH = "/indore/utils/device-manufacturers";

  constructor(private authenticatedApi: APIRequestContext) {}

  async getDeviceManufacturers(): Promise<DeviceManufacturerApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<DeviceManufacturerResponse>(
        this.authenticatedApi,
        DeviceManufacturerApi.PATH,
        "device-manufacturers",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
