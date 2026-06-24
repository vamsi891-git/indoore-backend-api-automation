import { expect } from "@playwright/test";
import { Module, Permission} from "../Mapper/modulepermission.mapper";
export class ModulePermissionValidator {
    // =====================================
    // ROOT RESPONSE
    // =====================================
    validateResponse(response: any) {
        expect(response).toBeDefined();
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    // =====================================
    // MODULES EXIST
    // =====================================
    validateModules(modules: Module[]) {
        expect(modules).toBeDefined();
        expect(Array.isArray(modules)).toBeTruthy();
        expect(modules.length).toBeGreaterThan(0);
    }
    //=====================================
    // MODULE STRUCTURE
    // =====================================
    validateModuleStructure(modules: Module[]) {
        for (const module of modules) {
            expect(module.id).toBeDefined();
            expect(module.key).toBeDefined();
            expect(module.name).toBeDefined();
            expect(module.sortOrder).toBeDefined();
            expect(module.permissions).toBeDefined();
            expect(typeof module.id).toBe("number");
            expect(typeof module.key).toBe("string");
            expect(typeof module.name).toBe("string");
            expect(typeof module.sortOrder).toBe("number");
            expect(typeof module.isEnabled).toBe("boolean");
            expect(Array.isArray(module.permissions)).toBeTruthy();
        }
    }
    // =====================================
    // MODULE BUSINESS RULES
    // =====================================
    validateModuleBusinessRules(modules: Module[]) {
        for (const module of modules) {
            expect(module.id).toBeGreaterThan(0);
            expect(module.key.trim().length).toBeGreaterThan(0);
            expect(module.name.trim().length).toBeGreaterThan(0);
            expect(module.sortOrder).toBeGreaterThanOrEqual(0);
        }
    }
    // =====================================
    // DUPLICATE MODULES
    // =====================================
    validateDuplicateModules(modules: Module[]) {
        const ids =modules.map(x => x.id);
        expect(new Set(ids).size).toBe(ids.length);
        const keys = modules.map( x => x.key);
        expect(new Set(keys).size).toBe(keys.length);
    }
    // =====================================
    // MODULE SORTING
    // =====================================
    validateModuleSorting(modules: Module[]) {
        for (let i = 1; i < modules.length; i++) {
            expect(modules[i].sortOrder).toBeGreaterThanOrEqual(modules[i - 1].sortOrder);
        }
    }
    // =====================================
    // PERMISSION STRUCTURE
    // =====================================
    validatePermissionStructure(modules: Module[]) {
        for (const module of modules) {
            for ( const permission of module.permissions) {
                expect(permission.id).toBeDefined();
                expect(permission.key).toBeDefined();
                expect(permission.name).toBeDefined();
                expect(permission.sortOrder).toBeDefined();
                expect(typeof permission.id).toBe("number");
                expect(typeof permission.key).toBe("string");
                expect(typeof permission.name).toBe("string");
                expect(typeof permission.sortOrder).toBe("number");
            }
        }
    }
    // =====================================
    // PERMISSION BUSINESS RULES
    // =====================================
    validatePermissionBusinessRules(modules: Module[]) {
        for ( const module  of modules ) {
            for ( const permission of module.permissions) {
                expect( permission.id).toBeGreaterThan(0);
                expect( permission.key.trim().length).toBeGreaterThan(0);
                expect(permission.name.trim().length).toBeGreaterThan(0);
                expect(permission.sortOrder).toBeGreaterThanOrEqual(0);
            }
        }
    }
    // =====================================
    // DUPLICATE PERMISSIONS
    // =====================================
    validateDuplicatePermissions(modules: Module[]) {
        const ids =new Set<number>();
        const keys = new Set<string>();
        for ( const module of modules) {
            for (const permission of module.permissions) {
                expect(ids.has(permission.id)).toBeFalsy();
                expect(keys.has(permission.key)).toBeFalsy();
                ids.add(permission.id);
                keys.add(permission.key);
            }
        }
    }
    // =====================================
    // PERMISSION SORTING
    // =====================================
    validatePermissionSorting(modules: Module[]) {
        for (const module of modules) {
            const permissions =module.permissions;
            for (let i = 1;i < permissions.length;i++) {
                expect(permissions[i].sortOrder).toBeGreaterThanOrEqual(permissions[i - 1].sortOrder);
            }
        }
    }
    // =====================================
    // PARENT CHILD VALIDATION
    // =====================================
    validateParentChildRelation(modules: Module[]) {
        for (const module of modules) {
            for (const permission  of module.permissions) {
                const rootKey = permission.key.split(".")[0];
                expect(rootKey.length).toBeGreaterThan(0);
            }
        }
    }
    // ====================================
    // PERMISSION KEY FORMAT
    // =====================================
    validatePermissionKeyPattern(modules: Module[]) {
        for (const module of modules) {
            for ( const permission of module.permissions) {
                expect(permission.key.includes(".")).toBeTruthy();
            }
        }
    }
    // =====================================
    // NULL VALIDATION
    // =====================================
    validateNullValues(modules: Module[]) {
        for ( const module of modules) {
            expect(module.id).not.toBeNull();
            expect(module.key).not.toBeNull();
            expect(module.name).not.toBeNull();
            expect(module.sortOrder).not.toBeNull();
            for (const permission of module.permissions) {
                expect(permission.id).not.toBeNull();
                expect(permission.key).not.toBeNull();
                expect(permission.name).not.toBeNull();
            }
        }
    }
    // =====================================
    // NaN VALIDATION
    // =====================================
    validateNaNValues(modules: Module[]) {
        for ( const module of modules) {
            expect(Number.isNaN(module.id)).toBeFalsy();
            expect(Number.isNaN(module.sortOrder)).toBeFalsy();
            for (const permission of module.permissions) {
                expect(Number.isNaN(permission.id)).toBeFalsy();
                expect(Number.isNaN(permission.sortOrder)).toBeFalsy();
            }
        }
    }
    // =====================================
    // CREATE MODULE
    // =====================================
    validateCreatedModule(module: Module,payload: any) {
        expect(module.id).toBeGreaterThan(0);
        expect(module.key).toBe(payload.key);
        expect(module.name).toBe(payload.name);
        expect(module.description).toBe(payload.description);
        expect(module.isEnabled).toBe(payload.isEnabled ?? true);
        expect(module.permissions.length).toBe(0);
    }
    // =====================================
    // UPDATE MODULE
    // =====================================
    validateUpdatedModule(module: Module,payload: any) {
        if (payload.key !== undefined) {
            expect(module.key).toBe(payload.key);
        }
        if (payload.name !== undefined) {
            expect(module.name).toBe(payload.name);
        }
        if (payload.description !== undefined) {
            expect(module.description).toBe(payload.description);
        }
        if (payload.isEnabled !== undefined) {
            expect(module.isEnabled).toBe(payload.isEnabled);
        }
    }
    // =====================================
    // CREATE PERMISSION
    // =====================================
    validateCreatedPermission(permission: Permission,payload: any) {
        expect(permission.id).toBeGreaterThan(0);
        expect(permission.key).toBe(payload.key);
        expect(permission.name).toBe(payload.name);
        expect(permission.description).toBe(payload.description);
    }

    // =====================================
    // UPDATE PERMISSION
    // =====================================
    validateUpdatedPermission(permission: Permission,payload: any) {
        expect(permission.key).toBe(payload.key);
        expect(permission.name).toBe(payload.name);
        expect(permission.description).toBe(payload.description);
    }
    // =====================================
    // DELETE VALIDATIONS
    // =====================================
    validateDeletePermission(statusCode: number) {
        expect([200, 204].includes(statusCode
                )).toBeTruthy();
    }
    validateDeleteModule(statusCode: number) {
        expect([200, 204].includes(statusCode)).toBeTruthy();
    }

    validateErrorResponse(
        status: number,
        body: { success?: boolean; error?: { code?: string; message?: string } },
        expectedStatuses: number[],
        expectedCode?: string,
    ) {
        expect(expectedStatuses).toContain(status);
        expect(body.success).toBe(false);
        expect(body.error?.code).toBeTruthy();
        if (expectedCode) {
            expect(body.error?.code).toBe(expectedCode);
        }
    }

    validatePermissionKeyMatchesModule(moduleKey: string, permissionKey: string) {
        const legacyModuleKeys = new Set(["dashboard", "hes_commands"]);
        if (legacyModuleKeys.has(moduleKey)) {
            return;
        }
        expect(permissionKey.startsWith(`${moduleKey}.`)).toBeTruthy();
    }
}