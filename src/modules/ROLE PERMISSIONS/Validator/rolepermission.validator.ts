import { expect } from "@playwright/test";
import { Role,  Module,  Permission,  RolePermissionDataResponse,  Toggle2FAResponse} from "../Mapper/rolepermission.mapper";
export class RolePermissionValidator {
    // =====================================
    // ROOT RESPONSE
    // =====================================
    validateResponse( response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    // =====================================
    // ROLES ARRAY
    // =====================================
    validateRoles(roles: Role[]) {
        expect(roles.length).toBeGreaterThan(0);
    }
    // =====================================
    // ROLE STRUCTURE
    // =====================================
    validateRoleStructure(roles: Role[]) {
        for (const role of roles) {
            expect(role.id).toBeDefined();
            expect(role.name).toBeTruthy();
            expect(role.sortOrder).toBeDefined();
            expect(typeof role.id).toBe("number");
            expect(typeof role.name).toBe("string");
            expect(typeof role.sortOrder).toBe("number");
            expect(typeof role.allowsHierarchyScope).toBe("boolean");
            expect(typeof role.isUltimate).toBe("boolean");
        }
    }

    // =====================================
    // DUPLICATE ROLE IDS
    // =====================================
    validateDuplicateRoles(roles: Role[]) {
        const ids =roles.map(x => x.id);
        expect(new Set(ids).size).toBe(ids.length);
        const names =roles.map(x => x.name);
        expect(new Set(names).size).toBe(names.length);
    }
    // =====================================
    // SORT ORDER VALIDATION
    // =====================================
    validateSortOrder(roles: Role[]) {
        for (let i = 1; i < roles.length; i++) {
            expect(roles[i].sortOrder).toBeGreaterThanOrEqual(roles[i - 1].sortOrder);
        }
    }
    // =====================================
    // ULTIMATE ROLE
    // =====================================
    validateUltimateRole(roles: Role[]) {
        const ultimateRoles = roles.filter(x => x.isUltimate);
        expect(ultimateRoles.length).toBe(1);
        const minSortOrder =Math.min(...roles.map(x => x.sortOrder));
        expect(ultimateRoles[0].sortOrder).toBe(minSortOrder);
    }
    // =====================================
    // CREATE ROLE
    // =====================================
    validateCreatedRole(role: Role,payload: any) {
        expect(role.id).toBeGreaterThan(0);
        expect(role.name).toBe(payload.name)
        expect(role.description).toBe(payload.description);
        expect(role.allowsHierarchyScope) .toBe(payload.allowsHierarchyScope);
        expect(role.isUltimate).toBeFalsy();
        expect(role.sortOrder).toBeGreaterThan(0);
    }
    // =====================================
    // UPDATE ROLE
    // =====================================
    validateUpdatedRole(role: Role,payload: any) {
        expect(role.name).toBe(payload.name);
        expect(role.description).toBe(payload.description);
        expect(role.allowsHierarchyScope).toBe(payload.allowsHierarchyScope);
        expect(role.isUltimate).toBeFalsy();
        expect(role.sortOrder).toBeGreaterThan(0);
    }
    validateRolePermissionResponse(data: RolePermissionDataResponse) {
        expect(data.id).toBeGreaterThan(0);
        expect(data.name).toBeTruthy();
        expect(data.modules.length).toBeGreaterThan(0);
    }

    // =====================================
    // MODULE STRUCTURE
    // =====================================

    validateModules(modules: Module[]) {
        const moduleIds =new Set<number>();
        const moduleKeys = new Set<string>();
        for (const module of modules) {
            expect(module.moduleId).toBeGreaterThan(0);
            expect(module.moduleKey).toBeTruthy();
            expect(module.moduleName).toBeTruthy();
            expect(typeof module.enabled).toBe("boolean");
            expect(Array.isArray(module.permissions)).toBeTruthy();
            expect(moduleIds.has(module.moduleId)).toBeFalsy();
            expect(moduleKeys.has(module.moduleKey)).toBeFalsy();
            moduleIds.add(module.moduleId);
            moduleKeys.add(module.moduleKey);
        }
    }

    validatePermissionCatalogPresent(modules: Module[]) {
        const totalPermissions = modules.reduce(
            (count, module) => count + module.permissions.length,
            0
        );
        expect(totalPermissions).toBeGreaterThan(0);
    }

    // =====================================
    // PERMISSION STRUCTURE
    // =====================================
    validatePermissions(modules: Module[]) {
        const permissionIds =new Set<number>();
        const permissionKeys =new Set<string>();
        for (const module of modules) {
            for (const permission of module.permissions) {
                expect(permission.permissionId).toBeGreaterThan(0);
                expect(permission.permissionKey).toBeTruthy();
                expect(permission.permissionName).toBeTruthy();
                expect(typeof permission.granted).toBe("boolean");
                expect(permissionIds.has(permission.permissionId)).toBeFalsy();
                expect(permissionKeys.has(permission.permissionKey)).toBeFalsy();
                permissionIds.add(permission.permissionId);
                permissionKeys.add(permission.permissionKey);
            }
        }
    }
    // =====================================
    // PERMISSION KEY FORMAT
    // =====================================
    validatePermissionKeyFormat( modules: Module[]) {
        for (const module of modules) {
            for (const permission of module.permissions) {
                const parts =permission.permissionKey.split(".");
                expect(parts.length).toBeGreaterThanOrEqual(2);
            }
        }
    }
    // =====================================
    // ENABLED MODULE LOGIC
    // =====================================
    validateModuleEnableLogic(modules: Module[]) {
        for (const module of modules) {
            const grantedPermissions =module.permissions.filter(x => x.granted);
            if (grantedPermissions.length > 0) {
                expect(module.enabled).toBeTruthy();
            }
        }
    }
    // =====================================
    // ASSIGNED PERMISSIONS
    // =====================================
    validateAssignedPermissions(modules: Module[],assignedKeys: string[]) {
        const grantedKeys: string[] = [];
        for (const module of modules) {
            for (const permission of module.permissions) {
                if ( permission.granted) {
                    grantedKeys.push(permission.permissionKey);
                }
            }
        }
        for ( const expectedKey of assignedKeys) {
            expect( grantedKeys ).toContain(expectedKey);
        }
    }
    // =====================================
    // NULL VALIDATION
    // =====================================
    validateNullValues(modules: Module[]) {
        for (const module of modules) {
            expect(module.moduleId).not.toBeNull();
            expect(module.moduleKey).not.toBeNull();
            expect(module.moduleName).not.toBeNull();
            for ( const permission  of module.permissions ) {
                expect( permission.permissionId ).not.toBeNull();
                expect(permission.permissionKey).not.toBeNull();
                expect(permission.permissionName).not.toBeNull();
            }
        }
    }

    // =====================================
    // NaN VALIDATION
    // =====================================
    validateNaNValues(modules: Module[]) {
        for (const module of modules) {
            expect(Number.isNaN(module.moduleId)).toBeFalsy();
            for (const permission of module.permissions) {
                expect(Number.isNaN(permission.permissionId)).toBeFalsy();
            }
        }
    }
    // =====================================
    // TOGGLE 2FA
    // =====================================
    validateToggle2FA(data: Toggle2FAResponse) {
        expect(data.updatedRoleIds.length).toBeGreaterThan(0);
        expect(typeof data.skippedUltimateRoleId).toBe("number");
        expect(data.updatedRoleIds.includes(data.skippedUltimateRoleId)).toBeFalsy();
        expect(new Set(data.updatedRoleIds).size).toBe(data.updatedRoleIds.length);
    }
    // =====================================
    // DELETE ROLE
    // =====================================
    validateDeleteResponse(response: any) {
        if (response == null) {
            return;
        }
        expect(response.success).toBeTruthy();
    }
}