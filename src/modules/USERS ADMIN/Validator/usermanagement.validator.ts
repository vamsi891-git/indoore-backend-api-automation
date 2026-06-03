import { expect } from "@playwright/test";
import { User, Device, UsersPagination} from "../Mapper/usermanagement.mapper";
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
        devices.forEach(device => {
            expect(device.id).toBeDefined();
            expect(device.name).toBeDefined();
            expect(device.browser).toBeDefined();
            expect(device.os).toBeDefined();
        });
    }
    // =====================================
    // DEVICE TYPES
    // =====================================
    validateDeviceTypes(devices: Device[]): void {
        const validTypes = ["desktop","mobile","tablet"];
        devices.forEach(device => {
            expect(validTypes).toContain(device.deviceType);
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
}