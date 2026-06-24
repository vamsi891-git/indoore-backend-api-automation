import { expect } from "@playwright/test";
import {
    User,
    Device,
    DeviceGroup,
    DeviceSession,
    AuditLog,
    ActionFilterOption,
    AuditLogsPagination,
    UsersPagination,
} from "../Mapper/usermanagement.mapper";
export class UserManagementValidator {
    // =====================================
    // ROOT RESPONSE
    // =====================================
    validateResponse(response: any): void {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    // =====================================
    // PAGINATION
    // =====================================
    validatePagination(pagination: UsersPagination,usersCount: number): void {
        expect(pagination.page).toBeGreaterThan(0);
        expect(pagination.limit).toBeGreaterThan(0);
        expect(pagination.total).toBeGreaterThanOrEqual(usersCount);
        expect(pagination.totalPages).toBeGreaterThan(0);
        expect(usersCount).toBeLessThanOrEqual(pagination.limit);
    }
    // =====================================
    // USERS EXIST
    // =====================================
    validateUsers(users: User[]): void {
        expect(users.length).toBeGreaterThan(0);
    }
    // =====================================
    // USER STRUCTURE
    // =====================================
    validateUserStructure(users: User[]): void {
        users.forEach(user => {
            expect(user.id).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.firstName).toBeDefined();
            expect(user.lastName).toBeDefined();
            expect(user.role).toBeDefined();
            expect(user.status).toBeDefined();
            expect(user.createdAt).toBeDefined();

        });
    }
    // =====================================
    // USER TYPES
    // =====================================
    validateUserTypes(users: User[]): void {
        users.forEach(user => {
            expect(typeof user.id).toBe("string");
            expect(typeof user.email).toBe("string");
            expect(typeof user.role).toBe("string");
            expect(typeof user.roleSortOrder).toBe("number");
            expect(typeof user.failedLoginAttempts).toBe("number");
        });
    }
    // =====================================
    // EMAIL VALIDATION
    // =====================================
    validateEmailFormat(users: User[]): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        users.forEach(user => {
            expect(emailRegex.test(user.email)).toBeTruthy();
        });
    }
    // =====================================
    // DUPLICATE USERS
    // =====================================
    validateDuplicateUsers(users: User[]): void {
        const ids =users.map(x => x.id);
        expect(ids.length).toBe(new Set(ids).size);
        const emails =users.map(x => x.email);
        expect(emails.length).toBe(new Set(emails).size);
    }
    // =====================================
    // ROLE RULES
    // =====================================
    validateRoleRules(users: User[]): void {
        users.forEach(user => {
            expect(user.roleSortOrder).toBeGreaterThanOrEqual(0);
            if (user.role === "admin") {
                expect(user.roleSortOrder).toBe(0);
            }
        });
    }
    // =====================================
    // STATUS RULES
    // =====================================
    validateStatusRules(users: User[]): void {
        const validStatuses = ["active","suspended"];
        users.forEach(user => {
            expect(validStatuses).toContain(user.status);
        });
    }
    // =====================================
    // SESSION RULES
    // =====================================
    validateSessionRules(users: User[]): void {
        users.forEach(user => {
            expect(user.sessionTimeoutMinutes).toBeGreaterThan(0);
            expect(user.sessionRefreshExpiresDays).toBeGreaterThan(0);
            expect(user.sessionAbsoluteLifetimeDays).toBeGreaterThan(0);
            expect(user.sessionRefreshExpiresDays).toBeLessThan(user.sessionAbsoluteLifetimeDays);
        });
    }
    // =====================================
    // DATE VALIDATION
    // =====================================
    validateDates(users: User[]): void {
        users.forEach(user => {
            expect(isNaN(Date.parse(user.createdAt))).toBeFalsy();
            if ((user as any).lastSuccessfulLoginAt) {
                expect(isNaN(Date.parse((user as any).lastSuccessfulLoginAt))).toBeFalsy();
            }
        });
    }
    // =====================================
    // NULL HANDLING
    // =====================================
    validateNullHandling(users: User[]): void {
        users.forEach(user => {
            expect(user.designation === null || typeof user.designation === "string").toBeTruthy();
            expect(user.department === null || typeof user.department === "string").toBeTruthy();
        });
    }
    // =====================================
    // NaN VALIDATION
    // =====================================
    validateNaNValues(users: User[]): void {
        users.forEach(user => {
            expect(Number.isNaN(user.roleSortOrder)).toBeFalsy();
            expect(Number.isNaN(user.failedLoginAttempts)).toBeFalsy();
        });
    }
    // =====================================
    // USER BY ID
    // =====================================
    validateUserById(user: User,requestedId: string): void {
        expect(user.id).toBe(requestedId);
    }
    // =====================================
    // CREATED BY
    // =====================================
    validateCreatedBy(user: User): void {
        if (user.createdBy) {
            expect(user.createdBy.id).toBeDefined();
            expect(user.createdBy.email).toContain("@");
        }
    }
    // =====================================
    // INVITED BY
    // =====================================
    validateInvitedBy(user: User): void {
        if (user.invitedBy) {
            expect(user.invitedBy.id).toBeDefined();
            expect(user.invitedBy.email).toContain("@");
        }
    }
    // =====================================
    // TWO FACTOR RULES
    // =====================================
    validateTwoFactorRules(user: User ): void {
        if (user.isTwoFactorSetupCompleted) {
            expect(user.isTwoFactorEnabled).toBeTruthy();
        }
    }
    // =====================================
    // UPDATE USER
    // =====================================
    validateUpdatedUser(user: User,payload: any): void {
        expect(user.firstName).toBe(payload.firstName);
        expect(user.lastName).toBe(payload.lastName);
        expect(user.phone).toBe(payload.phone );
        expect(user.designation).toBe(payload.designation);
    }
    // =====================================
    // STATUS UPDATE
    // ====================================
    validateStatusUpdate(user: User,expectedStatus: string): void {
        expect(user.status).toBe(expectedStatus);
    }
    // =====================================
    // DEVICES
    // =====================================
    validateDevices(devices: Device[]): void {
        devices.forEach((device) => {
            expect(device.id).toBeDefined();
            expect(device.name).toBeDefined();
            expect(device.browser).toBeDefined();
            expect(device.os).toBeDefined();
            expect(typeof device.isCurrentDevice).toBe("boolean");
            expect(Array.isArray(device.sessions)).toBeTruthy();
        });
    }

    validateDeviceGroups(deviceGroups: DeviceGroup[]): void {
        const osKeys = new Set<string>();
        for (const group of deviceGroups) {
            expect(group.osKey).toBeTruthy();
            expect(group.osLabel).toBeTruthy();
            expect(typeof group.deviceCount).toBe("number");
            expect(typeof group.activeSessionCount).toBe("number");
            expect(typeof group.hasCurrentDevice).toBe("boolean");
            expect(Array.isArray(group.devices)).toBeTruthy();
            expect(group.deviceCount).toBe(group.devices.length);
            expect(osKeys.has(group.osKey)).toBeFalsy();
            osKeys.add(group.osKey);

            if (group.lastSeenAt) {
                expect(Number.isNaN(Date.parse(group.lastSeenAt))).toBeFalsy();
            }
        }
    }

    validateDevicesResponse(data: {
        deviceGroups: DeviceGroup[];
        devices: Device[];
        unlinkedSessions: DeviceSession[];
    }): void {
        expect(Array.isArray(data.deviceGroups)).toBeTruthy();
        expect(Array.isArray(data.devices)).toBeTruthy();
        expect(Array.isArray(data.unlinkedSessions)).toBeTruthy();

        const groupedCount = data.deviceGroups.reduce(
            (count, group) => count + group.devices.length,
            0,
        );
        if (data.deviceGroups.length > 0) {
            expect(data.devices.length).toBe(groupedCount);
        }
    }

    validateEmptyDevicesContract(data: {
        deviceGroups: DeviceGroup[];
        devices: Device[];
        unlinkedSessions: DeviceSession[];
    }): void {
        this.validateDevicesResponse(data);
        expect(data.devices.length).toBe(0);
        expect(data.unlinkedSessions.length).toBe(0);
    }
    // =====================================
    // DEVICE TYPES
    // =====================================
    validateDeviceTypes(devices: Device[]): void {
        devices.forEach((device) => {
            expect(typeof device.deviceType).toBe("string");
            expect(device.deviceType.length).toBeGreaterThan(0);
        });
    }
    // =====================================
    // DEVICE SESSIONS
    // =====================================
    validateDeviceSessions(devices: Device[]): void {
        devices.forEach(device => {
            device.sessions.forEach(
                session => {
                    expect(session.sessionId).toBeDefined();
                    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(new Date(session.createdAt).getTime());
                }
            );
        });
    }
    // =====================================
    // DELETE DEVICE
    // =====================================
    validateDeletedDevice(response: any,deviceId: string): void {
        expect(response.deviceId).toBe(deviceId);
        expect(response.familiesRevoked).toBeGreaterThanOrEqual(0);
        expect(response.refreshRowsRevoked).toBeGreaterThanOrEqual(0);
    }
    // =====================================
    // FORCE LOGOUT
    // ====================================
    validateForceLogout(response: any): void {
        expect(response.revokedCount).toBeGreaterThanOrEqual(0);
        expect(response.revokedDeviceCount).toBeGreaterThanOrEqual(0);
        expect(typeof response.revokedCount).toBe("number");
        expect(typeof response.revokedDeviceCount).toBe("number");
    }

    validateAuditLogsPagination(
        pagination: AuditLogsPagination,
        logsCount: number,
    ): void {
        this.validatePagination(pagination, logsCount);
        if (pagination.total > pagination.limit && logsCount > 0) {
            expect(pagination.nextCursor).toBeTruthy();
        }
    }

    validateAuditLogsExist(logs: AuditLog[]): void {
        expect(logs.length).toBeGreaterThan(0);
    }

    validateAuditLogStructure(logs: AuditLog[]): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const log of logs) {
            expect(log.id).toBeTruthy();
            expect(
                log.actorId === null || typeof log.actorId === "string",
            ).toBeTruthy();
            expect(
                log.targetId === null || typeof log.targetId === "string",
            ).toBeTruthy();
            expect(typeof log.action).toBe("string");
            expect(log.action.length).toBeGreaterThan(0);
            expect(log.createdAt).toBeTruthy();
            expect(Number.isNaN(Date.parse(log.createdAt))).toBeFalsy();
            if (log.actorEmail != null && log.actorEmail.length > 0) {
                expect(emailRegex.test(log.actorEmail)).toBeTruthy();
            }
            if (log.targetEmail != null && log.targetEmail.length > 0) {
                expect(emailRegex.test(log.targetEmail)).toBeTruthy();
            }
            expect(
                log.details === null ||
                    log.details === undefined ||
                    typeof log.details === "object",
            ).toBeTruthy();
            expect(Array.isArray(log.detailsLines)).toBeTruthy();
            expect(typeof log.detailsLabel).toBe("string");
            expect(
                log.actionLabel === null || typeof log.actionLabel === "string",
            ).toBeTruthy();
            expect(
                log.ipAddress === null || typeof log.ipAddress === "string",
            ).toBeTruthy();
        }
    }

    validateDuplicateAuditLogIds(logs: AuditLog[]): void {
        const ids = logs.map((log) => log.id);
        expect(new Set(ids).size).toBe(ids.length);
    }

    validateAuditLogSortNewestFirst(logs: AuditLog[]): void {
        for (let i = 1; i < logs.length; i++) {
            const previous = new Date(logs[i - 1].createdAt).getTime();
            const current = new Date(logs[i].createdAt).getTime();
            expect(previous).toBeGreaterThanOrEqual(current);
        }
    }

    validateActionFilterOptions(options: ActionFilterOption[]): void {
        expect(options.length).toBeGreaterThan(0);
        const values = new Set<string>();
        for (const option of options) {
            expect(option.value).toBeTruthy();
            expect(option.label).toBeTruthy();
            expect(values.has(option.value)).toBeFalsy();
            values.add(option.value);
        }
        expect(values.has("auth.login_succeeded")).toBeTruthy();
        expect(values.has("user.update")).toBeTruthy();
    }

    validateAuditLogActionFilter(
        logs: AuditLog[],
        action: string,
    ): void {
        expect(logs.length).toBeGreaterThan(0);
        for (const log of logs) {
            expect(log.action).toBe(action);
        }
    }

    validateErrorResponse(
        status: number,
        body: { success?: boolean; error?: { code?: string; message?: string } },
        expectedStatuses: number[],
        expectedCode?: string,
    ): void {
        expect(expectedStatuses).toContain(status);
        expect(body.success).toBe(false);
        expect(body.error?.code).toBeTruthy();
        if (expectedCode) {
            expect(body.error?.code).toBe(expectedCode);
        }
    }

    /** Never target the authenticated automation account for destructive actions. */
    isAutomationAccountEmail(email: string, automationEmail: string): boolean {
        return (
            automationEmail.length > 0 &&
            email.toLowerCase() === automationEmail.toLowerCase()
        );
    }
}