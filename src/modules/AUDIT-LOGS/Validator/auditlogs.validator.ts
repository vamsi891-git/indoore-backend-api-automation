import { expect } from "@playwright/test";
import { AuditLogsData} from "../Mapper/auditlogs.mapper";
export class AuditLogsValidator {
    validateAuditLogsExists(data: AuditLogsData) {
        expect(data).toBeTruthy();
        expect(data.logs).toBeDefined();
    }
    validatePagination(data: AuditLogsData) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.limit).toBeGreaterThan(0);
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.logs.length).toBeLessThanOrEqual(data.limit);
        if (data.total > 0) {
            expect(data.totalPages).toBe(Math.ceil(data.total /data.limit));
        }
    }
    validateAuditLogFields(data: AuditLogsData) {
        data.logs.forEach(log => {
            expect(log.id).toBeTruthy();
            expect(log.actorId).toBeTruthy();
            expect(log.action).toBeTruthy();
            expect(log.createdAt).toBeTruthy();
        });
    }
    validateUuidFields(data: AuditLogsData) {
        const uuidRegex =/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        data.logs.forEach(log => {
            expect(uuidRegex.test(log.id)).toBeTruthy();
            expect(uuidRegex.test(log.actorId)).toBeTruthy();
            if (log.targetId) {
                expect(uuidRegex.test(log.targetId)).toBeTruthy();
            }
        });
    }
    validateEmails(data: AuditLogsData) {
        data.logs.forEach(log => {
            if (log.actorEmail) {
                expect(log.actorEmail).toContain("@");
                expect(log.actorEmail).toContain(".");
            }
            if (log.targetEmail) {
                expect(log.targetEmail).toContain("@");
                expect(log.targetEmail).toContain(".");
            }
        });
    }
    validateRoles(data: AuditLogsData) {
        data.logs.forEach(log => {
            if (log.actorRoleName ) {
                expect(log.actorRoleName.trim()).not.toEqual("");
            }
            if (log.targetRoleName ) {
                expect(log.targetRoleName.trim()).not.toEqual("");
            }
        });
    }
    validateFullNames(data: AuditLogsData) {
        data.logs.forEach(log => {
            if (log.actorFullName ) {
                expect(log.actorFullName.trim()).not.toEqual("");
            }
            if (log.targetFullName) {
                expect(log.targetFullName.trim()).not.toEqual("");
            }
        });
    }
    validateActions(data: AuditLogsData) {
        data.logs.forEach(log => {
            expect(log.action.trim()).not.toEqual("");
            expect(log.action).toContain(".");
        });
    }
    validateIpAddresses(data: AuditLogsData) {
        data.logs.forEach(log => {
            if (log.ipAddress) {
                expect(log.ipAddress.trim()).not.toEqual("");
            }
        });
    }
    validateDetails(data: AuditLogsData) {
        data.logs.forEach(log => {
            if (log.details !== null) {
                expect(typeof log.details).toBe("object");
            }
        });
    }
    validateCreatedAt(data: AuditLogsData) {
        data.logs.forEach(log => {
            const date =new Date(log.createdAt);
            expect(isNaN(date.getTime())).toBeFalsy();
        });
    }
    validateDuplicateIds(data: AuditLogsData) {
        const ids =data.logs.map(log => log.id);
        const duplicates =ids.filter((value,index) =>ids.indexOf(value) !== index);
        if (duplicates.length) {
            console.log("Duplicate Audit IDs:",duplicates);
        }
        expect(duplicates.length).toBe(0);
    }
    validateNextCursor(data: AuditLogsData) {
        if (data.total >data.limit) {
            expect(data.nextCursor).toBeTruthy();
        }
    }
    validateDescendingSort(data: AuditLogsData) {
        for (let i = 1;i < data.logs.length;i++) {
            const previous =new Date(data.logs[i - 1].createdAt);
            const current =new Date(data.logs[ i].createdAt);
            expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
        }
    }
    validateAscendingSort(data: AuditLogsData) {
        for ( let i = 1; i < data.logs.length; i++) {
            const previous =new Date(data.logs[i - 1].createdAt);
            const current = new Date( data.logs[ i].createdAt);
            expect(current.getTime()).toBeGreaterThanOrEqual( previous.getTime() );
        }
    }
    validateTargetConsistency(data: AuditLogsData) {
        data.logs.forEach(log => {
            if (log.targetId) {
                expect(log.targetId).toBeTruthy();
            }
        });
    }
    validateNoDataScenario(data: AuditLogsData) {
        if ( data.total === 0) {
            expect(data.logs.length).toBe(0);
            expect(data.nextCursor).toBeNull();
        }
    }
}