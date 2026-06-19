import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";

const ROLES_BASE = "/indore/permissions/roles";

export class RolePermissionApi extends TimedApiClient {
  getRoles(): Promise<ApiCallResult> {
    return this.getJson(ROLES_BASE);
  }

  createRole(payload: object): Promise<ApiCallResult> {
    return this.postJson(ROLES_BASE, { data: payload });
  }

  updateRole(roleId: number, payload: object): Promise<ApiCallResult> {
    return this.patchJson(`${ROLES_BASE}/${roleId}`, { data: payload });
  }

  getRolePermissions(roleId: number): Promise<ApiCallResult> {
    return this.getJson(`${ROLES_BASE}/${roleId}/permissions`);
  }

  assignPermissions(roleId: number, payload: object): Promise<ApiCallResult> {
    return this.putJson(`${ROLES_BASE}/${roleId}/permissions`, { data: payload });
  }

  toggle2FA(payload: object): Promise<ApiCallResult> {
    return this.postJson(`${ROLES_BASE}/permissions/2fa-manage`, { data: payload });
  }

  deleteRole(roleId: number): Promise<ApiCallResult> {
    return this.deleteJson(`${ROLES_BASE}/${roleId}`);
  }
}
