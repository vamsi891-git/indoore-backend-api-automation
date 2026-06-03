import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";

const MODULES_BASE = "/indore/permissions/modules";
const PERMISSIONS_BASE = "/indore/permissions/permissions";

export class ModulePermissionApi extends TimedApiClient {
    getModules(): Promise<ApiCallResult> {
        return this.getJson(MODULES_BASE);
    }

    createModule(payload: object): Promise<ApiCallResult> {
        return this.postJson(MODULES_BASE, { data: payload });
    }

    updateModule(moduleId: number, payload: object): Promise<ApiCallResult> {
        return this.patchJson(`${MODULES_BASE}/${moduleId}`, { data: payload });
    }

    createPermission(moduleId: number, payload: object): Promise<ApiCallResult> {
        return this.postJson(`${MODULES_BASE}/${moduleId}/permissions`, { data: payload });
    }

    updatePermission(permissionId: number, payload: object): Promise<ApiCallResult> {
        return this.patchJson(`${PERMISSIONS_BASE}/${permissionId}`, { data: payload });
    }

    deletePermission(permissionId: number): Promise<ApiCallResult> {
        return this.deleteJson(`${PERMISSIONS_BASE}/${permissionId}`);
    }

    deleteModule(moduleId: number): Promise<ApiCallResult> {
        return this.deleteJson(`${MODULES_BASE}/${moduleId}`);
    }
}