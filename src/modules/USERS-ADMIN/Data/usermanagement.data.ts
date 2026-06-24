import type { User } from "../Mapper/usermanagement.mapper";

/** Email of the account used in global setup (Bearer token). Never target for device delete / force logout. */
export function resolveAutomationEmail(): string {
    return String(process.env.EMAIL || process.env.USERNAME || "")
        .trim()
        .toLowerCase();
}

export function isAutomationAccount(user: { email: string }): boolean {
    const automationEmail = resolveAutomationEmail();
    return (
        automationEmail.length > 0 &&
        user.email.toLowerCase() === automationEmail
    );
}

export function resolveDeviceTestUserId(): string {
    return String(
        process.env.DEVICE_TEST_USER_ID ??
            "6012ce6a-cbb2-4b58-b38c-a969ff4507ed",
    ).trim();
}

export type UpdateUserPayload = {
    firstName: string;
    lastName: string;
    phone: string;
    designation: string;
    role: string;
    organisationId?: number;
    networkId?: number;
};

export const UserManagementData = {
    page: 1,
    limit: 20,
    userId: "",
    deviceId: "",
    unknownUserId: "00000000-0000-0000-0000-000000000000",
    unknownDeviceId: "00000000-0000-0000-0000-000000000001",
    updateUserPayload: {
        firstName: "Automation",
        lastName: "User",
        phone: "",
        designation: "manager",
        organisationId: 0,
        networkId: 0,
        role: "manager",
    } as UpdateUserPayload,
    updateStatusPayload: {
        status: "active",
    },
    suspendStatusPayload: {
        status: "suspended",
    },
    activeStatusPayload: {
        status: "active",
    },
    emptyUpdatePayload: {},
    invalidStatusPayload: {
        status: "not-a-valid-status",
    },
    invalidPhonePayload: {
        phone: "12",
    },
    auditLogQuery: {
        page: 1,
        limit: 20,
        sort: "createdAt_desc",
    },
    auditLogActionFilter: {
        page: 1,
        limit: 20,
        sort: "createdAt_desc",
        action: "user.update",
    },
    invalidAuditLogPageQuery: {
        page: 0,
        limit: 20,
        sort: "createdAt_desc",
    },
    invalidAuditLogSortQuery: {
        page: 1,
        limit: 20,
        sort: "not_a_valid_sort",
    },
    maxResponseTime: 60000,
    buildUniquePhone(): string {
        return `9${Date.now().toString().slice(-9)}`;
    },
    /** Omits scope IDs the user does not have — API rejects networkId/organisationId <= 0. */
    buildUpdateUserPayload(user: User): UpdateUserPayload {
        const payload: UpdateUserPayload = {
            firstName: "Automation",
            lastName: "User",
            phone: UserManagementData.buildUniquePhone(),
            designation: user.designation ?? "manager",
            role: user.role,
        };

        if (
            user.organisationLookupId != null &&
            user.organisationLookupId > 0
        ) {
            payload.organisationId = user.organisationLookupId;
        }
        if (user.networkLookupId != null && user.networkLookupId > 0) {
            payload.networkId = user.networkLookupId;
        }

        return payload;
    },
};

export const UserDevicesTestConfig = {
    pageSize: 50,
    deviceTestUserId: resolveDeviceTestUserId(),
};
