import { expect } from "@playwright/test";
import { AuditLogExportRow } from "../Utils/auditlogexport.types";
export class AuditLogExportValidator {
    validateFileNotEmpty(csvContent: string) {
        expect(csvContent).toBeTruthy();
        expect(csvContent.length).toBeGreaterThan(0);
    }
    validateHeaders(csvContent: string) {
        const headerRow =csvContent.split("\n")[0].trim();
        const expectedHeaders = ["id","createdAt","action","actorId","actorEmail","actorFullName","actorRoleName","targetId","targetEmail","targetFullName","targetRoleName","ipAddress","details"];
        const actualHeaders =headerRow.split(",");
        expect(actualHeaders).toEqual(expectedHeaders);
    }
    validateRowCount(
        rows: AuditLogExportRow[],
        limit: number
    ) {
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThanOrEqual(limit);
    }
    validateAuditRows(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
                expect(row.id).toBeTruthy();
                expect(row.actorId).toBeTruthy();
                expect(row.action).toBeTruthy();
                expect(row.createdAt).toBeTruthy();

        });
    }
    validateUUIDs(rows: AuditLogExportRow[]) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        rows.forEach(row => {
            expect(uuidRegex.test(row.id)).toBeTruthy();
            expect(uuidRegex.test(row.actorId)).toBeTruthy();
            if (row.targetId) {
                expect(uuidRegex.test(row.targetId)).toBeTruthy();
            }
        });
    }
    validateEmails(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
            if (row.actorEmail) {
                expect(row.actorEmail).toContain("@");
                expect(row.actorEmail).toContain(".");
            }
            if (row.targetEmail) {
                expect(row.targetEmail).toContain("@");
                expect(row.targetEmail).toContain(".");
            }
        });
    }
    validateActions(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
            expect(row.action.trim()).not.toEqual("");
            expect(row.action).toContain(".");
        });
    }
    validateRoles(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
            if (row.actorRoleName) {
                expect(row.actorRoleName.trim()).not.toEqual("");
            }
            if (row.targetRoleName) {
                expect(row.targetRoleName.trim()).not.toEqual("");
            }
        });
    }
    validateFullNames(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
            if (row.actorFullName) {
                expect(row.actorFullName.trim()).not.toEqual("");
            }
            if (row.targetFullName) {
                expect(row.targetFullName.trim()).not.toEqual("");
            }
        });
    }
    validateCreatedAt(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
            const date =new Date(row.createdAt);
            expect(isNaN(date.getTime())).toBeFalsy();
        });
    }
    validateIpAddresses(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
            if (row.ipAddress) {
                expect(row.ipAddress.trim()).not.toEqual("");
            }
        });
    }
    validateDetails(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
            if (row.details && row.details !== "null") {
                expect(row.details.length).toBeGreaterThan(0);
            }
        });
    }
    validateDuplicateIds(rows: AuditLogExportRow[]) {
        const ids =rows.map(row => row.id);
        const duplicates =ids.filter((value,index) =>ids.indexOf(value) !== index);
        if (duplicates.length) {
            console.log("Duplicate Audit IDs:",duplicates);
        }
        expect(duplicates.length).toBe(0);
    }
    validateAscendingSort(rows: AuditLogExportRow[]) {
        for (let i = 1; i < rows.length; i++) {
            const previous =new Date(rows[i - 1].createdAt);
            const current =new Date(rows[i].createdAt);
            expect(current.getTime()).toBeGreaterThanOrEqual(previous.getTime());
        }
    }
    validateDescendingSort(rows: AuditLogExportRow[]) {
        for (let i = 1;i < rows.length;i++) {
            const previous =new Date(rows[i - 1] .createdAt);
            const current =new Date(rows[i].createdAt);
            expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
        }
    }
    validateTargetConsistency(rows: AuditLogExportRow[]) {
        rows.forEach(row => {
            if (row.targetId) {
                const hasTargetData = row.targetEmail || row.targetFullName || row.targetRoleName;
                expect(hasTargetData).toBeTruthy();
            }
        });
    }
    validateNoDataScenario(rows: AuditLogExportRow[]) {
        if (rows.length === 0 ) {
            expect(rows).toEqual([]);
        }
    }
}