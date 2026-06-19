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

    /** Built at runtime from GET role permissions catalog — see RolePermissionMapper.buildAssignPermissionPayload */
    toggle2FAPayload: {
         enabled: true
    },
    roleId: 0,
    maxResponseTime: 60000
};