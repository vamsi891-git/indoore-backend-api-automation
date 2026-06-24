import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
const USERS_BASE = "/indore/users";
export class UserManagementApi extends TimedApiClient {
  getUsers(page: number, limit: number): Promise<ApiCallResult> {
    return this.getJson(USERS_BASE, { params: { page, limit } });
  }
  getUserById(userId: string): Promise<ApiCallResult> {
    return this.getJson(`${USERS_BASE}/${userId}`);
  }
  updateUser(userId: string, payload: object): Promise<ApiCallResult> {
    return this.patchJson(`${USERS_BASE}/${userId}`, { data: payload });
  }
  updateUserStatus(userId: string, payload: object): Promise<ApiCallResult> {
    return this.patchJson(`${USERS_BASE}/${userId}/status`, { data: payload });
  }
  getUserDevices(userId: string): Promise<ApiCallResult> {
    return this.getJson(`${USERS_BASE}/${userId}/devices`);
  }
  deleteDevice(userId: string, deviceId: string): Promise<ApiCallResult> {
    return this.deleteJson(`${USERS_BASE}/${userId}/devices/${deviceId}`);
  }
  forceLogout(userId: string): Promise<ApiCallResult> {
    return this.postJson(`${USERS_BASE}/${userId}/force-logout`);
  }

  getAuditLogs(params: {
    page?: number;
    limit?: number;
    sort?: string;
    action?: string;
  }): Promise<ApiCallResult> {
    return this.getJson(`${USERS_BASE}/audit-logs`, { params });
  }
}
