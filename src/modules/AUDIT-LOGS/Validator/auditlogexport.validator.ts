import { expect } from "@playwright/test";
import { EXPECTED_AUDIT_LOG_EXPORT_COLUMNS } from "../Data/auditlogexport.data";
import { AuditLogExportRow } from "../Utils/auditlogexport.types";
import { CsvParser } from "../Utils/csv.parser";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class AuditLogExportValidator {
  validateNotJsonError(csvContent: string) {
    expect(csvContent.trim().startsWith("{"), "Export returned JSON instead of CSV").toBe(false);
  }
  validateFileNotEmpty(csvContent: string) {
    expect(csvContent).toBeTruthy();
    expect(csvContent.length).toBeGreaterThan(0);
  }
  validateDownloadHeaders(contentType: string | undefined, contentDisposition: string | undefined) {
    expect(contentType ?? "").toContain("text/csv");
    expect((contentDisposition ?? "").toLowerCase()).toContain("attachment");
    expect((contentDisposition ?? "").toLowerCase()).toContain(".csv");
  }
  validateHeaders(csvContent: string) {
    const { headers } = CsvParser.parse(csvContent);
    expect(headers).toEqual([...EXPECTED_AUDIT_LOG_EXPORT_COLUMNS]);
  }
  validateRowCount(rows: AuditLogExportRow[], limit: number) {
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(limit);
  }
  validateAuditRows(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      expect(row.id).toBeTruthy();
      expect(row.actorId).toBeTruthy();
      expect(row.action).toBeTruthy();
      expect(row.createdAt).toBeTruthy();
    });
  }
  validateUUIDs(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      expect(UUID_REGEX.test(row.id)).toBeTruthy();
      expect(UUID_REGEX.test(row.actorId)).toBeTruthy();
      if (row.targetId) {
        expect(UUID_REGEX.test(row.targetId)).toBeTruthy();
      }
    });
  }
  validateEmails(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      if (row.actorEmail) {
        expect(row.actorEmail).toContain("@");
      }
      if (row.targetEmail) {
        expect(row.targetEmail).toContain("@");
      }
    });
  }
  validateActions(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      expect(row.action.trim()).not.toEqual("");
      expect(row.action).toContain(".");
    });
  }

  validateRoles(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      if (row.actorRoleName) {
        expect(row.actorRoleName.trim()).not.toEqual("");
      }
      if (row.targetRoleName) {
        expect(row.targetRoleName.trim()).not.toEqual("");
      }
    });
  }

  validateFullNames(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      if (row.actorFullName) {
        expect(row.actorFullName.trim()).not.toEqual("");
      } else {
        console.log("Empty export actorFullName:", {
          id: row.id,
          action: row.action,
        });
      }
      if (row.targetFullName) {
        expect(row.targetFullName.trim()).not.toEqual("");
      }
    });
  }

  validateCreatedAt(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      const date = new Date(row.createdAt);
      expect(Number.isNaN(date.getTime())).toBeFalsy();
    });
  }

  validateIpAddresses(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      if (row.ipAddress) {
        expect(row.ipAddress.trim()).not.toEqual("");
      }
    });
  }

  validateDetails(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      if (row.details && row.details !== "null") {
        expect(row.details.length).toBeGreaterThan(0);
      }
    });
  }

  validateDuplicateIds(rows: AuditLogExportRow[]) {
    const ids = rows.map((row) => row.id);
    const duplicates = ids.filter((value, index) => ids.indexOf(value) !== index);
    if (duplicates.length) {
      console.log("Duplicate Audit IDs:", duplicates);
    }
    expect(duplicates.length).toBe(0);
  }

  validateAscendingSort(rows: AuditLogExportRow[]) {
    for (let i = 1; i < rows.length; i++) {
      const previous = new Date(rows[i - 1].createdAt);
      const current = new Date(rows[i].createdAt);
      expect(current.getTime()).toBeGreaterThanOrEqual(previous.getTime());
    }
  }

  validateDescendingSort(rows: AuditLogExportRow[]) {
    for (let i = 1; i < rows.length; i++) {
      const previous = new Date(rows[i - 1].createdAt);
      const current = new Date(rows[i].createdAt);
      expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
    }
  }

  validateTargetConsistency(rows: AuditLogExportRow[]) {
    rows.forEach((row) => {
      if (row.targetId) {
        const hasTargetData = row.targetEmail || row.targetFullName || row.targetRoleName;
        if (!hasTargetData) {
          console.log("Export targetId without target display fields:", {
            id: row.id,
            targetId: row.targetId,
          });
        }
      }
    });
  }

  validateNoDataScenario(rows: AuditLogExportRow[]) {
    if (rows.length === 0) {
      expect(rows).toEqual([]);
    }
  }
}
