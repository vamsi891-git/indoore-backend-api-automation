// =====================================
// PAGINATION
// =====================================

export interface UsersPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
// =====================================
// USER REFERENCE
// =====================================
export interface UserReference {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}
// =====================================
// USER
// ====================================
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    designation: string | null;
    department: string | null;
    role: string;
    roleSortOrder: number;
    roleDescription: string | null;
    organisationScopeId: number | null;
    organisationLookupId: number | null;
    organisationScopeName: string | null;
    networkScopeId: number | null;
    networkLookupId: number | null;
    networkScopeName: string | null;
    createdBy: UserReference | null;
    invitedBy: UserReference | null;
    isTwoFactorEnabled: boolean;
    isTwoFactorSetupCompleted: boolean;
    isTwoFactorEnforced: boolean;
    sessionTimeoutMinutes: number;
    sessionRefreshExpiresDays: number;
    sessionAbsoluteLifetimeDays: number;
    failedLoginAttempts: number;
    status: string;
    createdAt: string;
}

// =====================================
// SESSION
// =====================================
export interface DeviceSession {
    sessionId: string;
    ipAddress: string;
    location: string;
    createdAt: string;
    lastActiveAt: string;
    expiresAt: string;
}
// =====================================
// DEVICE
// =====================================

export interface Device {
    id: string;
    name: string;
    deviceType: string;
    browser: string;
    os: string;
    userAgent: string;
    lastIpAddress: string;
    lastLocationText: string;
    createdAt: string;
    lastSeenAt: string;
    trustedAt: string | null;
    revokedAt: string | null;
    isCurrentDevice: boolean;
    sessions: DeviceSession[];
}
// =====================================
// USER MAPPER
// ======
export class UserManagementMapper {
    static mapUsers(response: any) {
        const data = response?.data ?? {};
        return {
        users:data.users ?? [],
            pagination: {
                total:data.total ?? 0,
                page:data.page ?? 0,
                limit:data.limit ?? 0,
                totalPages:data.totalPages ?? 0
            }
        };
    }
    static mapUser(response: any): User {
        return response?.data?.user;
    }
    static mapDevices(response: any) {
        const data = response?.data ?? {};
        return {
            devices:data.devices ?? [],
            unlinkedSessions:data.unlinkedSessions ?? []
        };
    }
    static mapForceLogout(response: any) {
        const data = response?.data ?? {};
        return {
            revokedCount:data.revokedCount ?? 0,
            revokedDeviceCount:data.revokedDeviceCount ?? 0
        };
    }
    static mapDeleteDevice(response: any) {
        const data = response?.data ?? {};
        return {
            deviceId:data.deviceId ?? "",
            familiesRevoked:data.familiesRevoked ?? 0,
            refreshRowsRevoked:data.refreshRowsRevoked ?? 0
        };
    }
}