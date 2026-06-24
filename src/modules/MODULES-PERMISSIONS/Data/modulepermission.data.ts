const uniqueSuffix = () => Date.now();

export const ModulePermissionData = {
    createModulePayload: {
        key: `module_${uniqueSuffix()}`,
        name: "Automation Module",
        description: "Module Created By Automation",
        sortOrder: 0,
    },
    updateModulePayload: {
        key: `module_updated_${uniqueSuffix()}`,
        name: "Updated Module",
        description: "Updated Module Description",
        sortOrder: 0,
        isEnabled: true,
    },
    disableModulePayload: {
        isEnabled: false,
    },
    createPermissionPayload: {
        key: "",
        name: "View Automation",
        description: "Permission Created By Automation",
        sortOrder: 0,
    },
    updatePermissionPayload: {
        key: "",
        name: "Edit Automation",
        description: "Permission Updated By Automation",
        sortOrder: 0,
    },
    moduleId: 0,
    permissionId: 0,
    maxResponseTime: 60000,
    protectedModuleKeys: ["user_management", "roles_permissions"] as const,
    protectedRoleNames: ["admin", "superadmin", "manager", "viewer", "user"] as const,
    unknownResourceId: 9_999_999,
    invalidModuleKeyPayload: {
        key: "Bad-Key",
        name: "Invalid Module Key",
    },
    invalidModuleNamePayload: {
        key: `invalid_name_${uniqueSuffix()}`,
        name: "x",
    },
    invalidPermissionKeyNoDot: {
        key: "view",
        name: "Invalid Permission",
        sortOrder: 0,
    },
    buildUniqueModulePayload(suffix = uniqueSuffix()) {
        return {
            key: `auto_mod_${suffix}`,
            name: "Automation Test Module",
            description: "Created for negative/validation tests",
            sortOrder: 0,
        };
    },
    buildPermissionPayload(moduleKey: string, action = "view") {
        return {
            key: `${moduleKey}.${action}`,
            name: `${action} Automation Permission`,
            description: "Permission for automation tests",
            sortOrder: 0,
        };
    },
    buildMismatchedPermissionPayload(_moduleKey: string) {
        return {
            key: "billing.view",
            name: "Mismatched Prefix Permission",
            sortOrder: 0,
        };
    },
};
