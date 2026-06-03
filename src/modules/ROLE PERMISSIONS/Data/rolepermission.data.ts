export const RolePermissionData = {
    createRolePayload: {
        name:`role_${Date.now()}`,
        description:"Automation Created Role",
        allowsHierarchyScope:true
    },
    updateRolePayload: {
        name:`updated_role_${Date.now()}`,
        description:"Automation Updated Role",
        allowsHierarchyScope:true
    },

    assignPermissionPayload: {
        permissionKeys: [
            "user_management.view",
            "user_management.create",
            "user_management.view_audit_logs"
        ]
    },
    toggle2FAPayload: {
         enabled: true
    },
    roleId: 0,
    maxResponseTime: 60000
};