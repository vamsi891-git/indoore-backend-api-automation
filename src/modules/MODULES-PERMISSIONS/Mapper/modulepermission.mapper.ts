// =====================================
// PERMISSION
// =====================================
export interface Permission {
    id: number;
    key: string;
    name: string;
    description: string | null;
    sortOrder: number;
}
// =====================================
// MODULE
// =====================================
export interface Module {
    id: number;
    key: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isEnabled: boolean;
    permissions: Permission[];
}
// =====================================
// MAPPER
// =====================================
export class ModulePermissionMapper {
    // =====================================
    // MAP ALL MODULES
    // =====================================
    static mapModules(response: any): Module[] {
        return response.data.modules.map((module: any) => ({
                id:module.id,
                key:module.key,
                name:module.name,
                description:module.description,
                sortOrder:module.sortOrder,
                isEnabled:module.isEnabled ?? true,
                permissions:module.permissions ?? []
            })
        );
    }
    // =====================================
    // MAP MODULE
    // =====================================
    static mapModule(response: any): Module {
        return {

            id:response.data.module.id,
            key:response.data.module.key,
            name:response.data.module.name,
            description:response.data.module.description,
            sortOrder:response.data.module.sortOrder,
            isEnabled:response.data.module.isEnabled ?? true,
            permissions:response.data.module.permissions ?? []
        };
    }
    // =====================================
    // MAP PERMISSION
    // =====================================
    static mapPermission(response: any): Permission {
        const permission =response.data.permission;
        return {
            id:permission.id,
            key:permission.key,
            name:permission.name,
            description:permission.description,
            sortOrder:permission.sortOrder
        };
    }
}