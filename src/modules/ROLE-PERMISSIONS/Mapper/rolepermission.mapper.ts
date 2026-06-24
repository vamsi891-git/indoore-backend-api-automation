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
    /** Catalog flag — module enabled in the permissions catalog. */
    moduleIsEnabled: boolean;
    /** Role-level toggle — grants/revokes all permissions in the module. */
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

    static collectGrantedKeys(modules: Module[]): string[] {
        const keys: string[] = [];
        for (const module of modules) {
            for (const permission of module.permissions) {
                if (permission.granted) {
                    keys.push(permission.permissionKey);
                }
            }
        }
        return keys;
    }

    static findModule(modules: Module[], moduleKey: string): Module | undefined {
        return modules.find((module) => module.moduleKey === moduleKey);
    }

    static findModuleById(modules: Module[], moduleId: number): Module | undefined {
        return modules.find((module) => module.moduleId === moduleId);
    }

    /** Two distinct permission keys from different modules for replace-semantics tests. */
    static pickReplacePermissionKeys(
        modules: Module[],
        requires: Record<string, string[]> = {},
    ): { firstKeys: string[]; secondKeys: string[] } | null {
        const catalogKeys = new Set(
            modules.flatMap((module) =>
                module.permissions.map((permission) => permission.permissionKey),
            ),
        );

        const isStableModuleKey = (moduleKey: string): boolean =>
            !/module_updated_|^auto_|test_module/i.test(moduleKey);

        const hasResolvableDeps = (key: string): boolean => {
            const deps = requires[key];
            if (!deps?.length) {
                return true;
            }
            return deps.every(
                (dep) => dep === key || catalogKeys.has(dep),
            );
        };

        const preferredModuleOrder = [
            "analysis",
            "reports",
            "events",
            "billing",
            "communication",
        ];

        const candidates: { moduleKey: string; moduleId: number; key: string }[] =
            [];
        for (const module of modules) {
            if (module.moduleIsEnabled === false || !isStableModuleKey(module.moduleKey)) {
                continue;
            }
            for (const permission of module.permissions) {
                const key = permission.permissionKey?.trim();
                if (key && hasResolvableDeps(key)) {
                    candidates.push({
                        moduleKey: module.moduleKey,
                        moduleId: module.moduleId,
                        key,
                    });
                }
            }
        }

        candidates.sort((a, b) => {
            const aRank = preferredModuleOrder.indexOf(a.moduleKey);
            const bRank = preferredModuleOrder.indexOf(b.moduleKey);
            const aScore = aRank === -1 ? 999 : aRank;
            const bScore = bRank === -1 ? 999 : bRank;
            return aScore - bScore;
        });

        const first = candidates[0];
        const second = candidates.find(
            (entry) =>
                entry.moduleId !== first?.moduleId && entry.key !== first?.key,
        );

        if (!first || !second) {
            return null;
        }

        return {
            firstKeys: [first.key],
            secondKeys: [second.key],
        };
    }

    /**
     * Picks a permission that has dependency requires in the catalog
     * (prefers user_management.update → user_management.view).
     */
    static pickDependencyAssignCase(
        requires: Record<string, string[]>,
        modules: Module[],
    ): { permissionKey: string; requiredKeys: string[] } | null {
        const catalogKeys = new Set(
            modules.flatMap((module) =>
                module.permissions.map((permission) => permission.permissionKey),
            ),
        );

        const preferred = "user_management.update";
        const preferredDeps = requires[preferred]?.filter(
            (key) => key !== preferred && catalogKeys.has(key),
        );
        if (preferredDeps?.length) {
            return { permissionKey: preferred, requiredKeys: preferredDeps };
        }

        for (const [permissionKey, deps] of Object.entries(requires)) {
            if (!catalogKeys.has(permissionKey)) {
                continue;
            }
            const requiredKeys = deps.filter(
                (key) => key !== permissionKey && catalogKeys.has(key),
            );
            if (requiredKeys.length > 0) {
                return { permissionKey, requiredKeys };
            }
        }

        return null;
    }
}