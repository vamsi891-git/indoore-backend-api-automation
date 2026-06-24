const uniqueSuffix = () => Date.now();

export const RolePermissionData = {
    createRolePayload: {
        name: `role_${uniqueSuffix()}`,
        description: "Automation Created Role",
        allowsHierarchyScope: true,
    },
    updateRolePayload: {
        name: `updated_role_${uniqueSuffix()}`,
        description: "Automation Updated Role",
        allowsHierarchyScope: true,
    },
    toggle2FAPayload: {
        enabled: true,
    },
    setModuleEnabledPayload: {
        enabled: false,
    },
    reenableModulePayload: {
        enabled: true,
    },
    preferredModuleKey: "analysis",
    preferredDependencyAssignKey: "user_management.update",
    roleId: 0,
    maxResponseTime: 60000,
    unknownResourceId: 9_999_999,
    invalidRoleNameUppercase: {
        name: "Admin",
        description: "Invalid uppercase role name",
    },
    invalidRoleNameShort: {
        name: "a",
        description: "Too short",
    },
    unknownPermissionKeys: {
        permissionKeys: ["nonexistent.permission.key"],
    },
    emptyPermissionKeys: {
        permissionKeys: [] as string[],
    },
    buildUniqueRolePayload(suffix = uniqueSuffix()) {
        return {
            name: `auto_role_${suffix}`,
            description: "Automation role for negative tests",
            allowsHierarchyScope: false,
        };
    },
};
