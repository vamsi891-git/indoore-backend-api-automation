import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { AuthPaths } from "../Data/auth.data";

export class AuthSessionApi extends TimedApiClient {
  getMe(): Promise<ApiCallResult> {
    return this.getJson(AuthPaths.me);
  }

  getDevices(): Promise<ApiCallResult> {
    return this.getJson(AuthPaths.devices);
  }

  deleteDevice(deviceId: string): Promise<ApiCallResult> {
    return this.deleteJson(AuthPaths.deviceById(deviceId));
  }
}
