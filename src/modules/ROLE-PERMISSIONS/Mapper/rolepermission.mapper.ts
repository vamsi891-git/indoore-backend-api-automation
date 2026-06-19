export interface Role {
    id: number;
    name: string;
    description: string | null;
    sortOrder: number;
    allowsHierarchyScope: boolean;
    isUltimate: boolean;
}

export interface Permission {
    permissionId: number;
    permissionKey: string;
    permissionName: string;
    granted: boolean;
}

export interface Module {
    moduleId: number;
    moduleKey: string;
    moduleName: string;
    enabled: boolean;
    permissions: Permission[];
}

export interface RolePermissionDataResponse {
    id: number;
    name: string;
    description: string | null;
    sortOrder: number;
    allowsHierarchyScope: boolean;
    isUltimate: boolean;
    modules: Module[];
}

export interface Toggle2FAResponse {
    updatedRoleIds: number[];
    skippedUltimateRoleId: number;
}

export class RolePermissionMapper {
    static mapRoles(response: any): Role[] {
        return response.data.roles.map(
            (role: any) => ({
                id:role.id,
                name:role.name,
                description:role.description,
                sortOrder:role.sortOrder,
                allowsHierarchyScope:role.allowsHierarchyScope,
                isUltimate:role.isUltimate
            })
        );
    }
    static mapRole(response: any): Role {
        return {
            id:response.data.role.id,
            name:response.data.role.name,
            description:response.data.role.description,
            sortOrder:response.data.role.sortOrder,
            allowsHierarchyScope:response.data.role.allowsHierarchyScope,
            isUltimate:response.data.role.isUltimate
        };
    }
    static mapRolePermissions(response: any): RolePermissionDataResponse {
        return {
            id:response.data.id,
            name:response.data.name,
            description:response.data.description,
            sortOrder:response.data.sortOrder,
            allowsHierarchyScope:response.data.allowsHierarchyScope,
            isUltimate:response.data.isUltimate,
            modules:response.data.modules
        };
    }
    static mapToggle2FA(response: any): Toggle2FAResponse {
        return {
            updatedRoleIds:response.data.updatedRoleIds,
            skippedUltimateRoleId:response.data.skippedUltimateRoleId
        };
    }

    /** Picks real permission keys from the role catalog (avoids 400 on unknown keys). */
    static buildAssignPermissionPayload(
        modules: Module[],
        count: number = 3
    ): { permissionKeys: string[] } {
        const preferred =
            modules.find((m) => m.moduleKey === "user_management") ??
            modules[0];

        let keys =
            preferred?.permissions
                .map((p) => p.permissionKey)
                .filter((key) => Boolean(key?.trim()))
                .slice(0, count) ?? [];

        if (keys.length < count) {
            const allKeys = modules.flatMap((m) =>
                m.permissions.map((p) => p.permissionKey)
            );
            keys = [...new Set(allKeys)]
                .filter((key) => Boolean(key?.trim()))
                .slice(0, count);
        }

        if (keys.length === 0) {
            throw new Error(
                "Role permission catalog has no permission keys to assign"
            );
        }

        return { permissionKeys: keys };
    }
}