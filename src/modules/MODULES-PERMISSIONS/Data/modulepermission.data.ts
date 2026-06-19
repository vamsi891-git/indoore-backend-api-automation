export const ModulePermissionData = {
    // =====================================
    // CREATE MODULE
    // =====================================
    createModulePayload: {
        key:`module_${Date.now()}`,
        name:"Automation Module",
        description:"Module Created By Automation",
        sortOrder:0
    },
    // =====================================
    // UPDATE MODULE
    // =====================================
    updateModulePayload: {
        key:`module_updated_${Date.now()}`,
        name:"Updated Module",
        description:"Updated Module Description",
        sortOrder:0
    },
    // =====================================
    // CREATE PERMISSION
    // =====================================
    createPermissionPayload: {
        key:"",
        name:"View Automation",
        description:"Permission Created By Automation",
        sortOrder:0
    },
    // =====================================
    // UPDATE PERMISSION
    // =====================================
    updatePermissionPayload: {
        key:"",
        name:"Edit Automation",
        description:"Permission Updated By Automation",
        sortOrder:0
    },
    // =====================================
    // RUNTIME IDS
    // ====================================
    moduleId: 0,
    permissionId: 0,
    // =====================================
    // PERFORMANCE
    // =====================================
    maxResponseTime: 60000
};