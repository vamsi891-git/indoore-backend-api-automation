import { expect } from "@playwright/test";
import {
  AuditLogsData,
  AuditLogsQuery,
  AuditLogsResponse,
} from "../Mapper/auditlogs.mapper";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

export class AuditLogsValidator {
  validateResponse(response: AuditLogsResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateAuditLogsExist(data: AuditLogsData): void {
    expect(data.logs).toBeDefined();
    if (data.total > 0) {
      expect(data.logs.length).toBeGreaterThan(0);
    } else {
      expect(data.logs.length).toBe(0);
    }
  }

  validatePagination(data: AuditLogsData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.logs.length).toBeLessThanOrEqual(data.limit);

    if (data.total === 0) {
      expect(data.totalPages).toEqual(0);
      expect(data.logs.length).toEqual(0);
      return;
    }

    expect(data.totalPages).toEqual(Math.ceil(data.total / data.limit));

    if (data.page < data.totalPages) {
      expect(data.logs.length).toEqual(data.limit);
    } else if (data.page === data.totalPages) {
      const remainder = data.total % data.limit;
      const expectedRows = remainder === 0 ? data.limit : remainder;
      expect(data.logs.length).toEqual(expectedRows);
    }
  }

  validateQueryParams(data: AuditLogsData, query: AuditLogsQuery): void {
    expect(data.page).toEqual(query.page ?? 1);
    expect(data.limit).toEqual(query.limit ?? 20);
  }

  validateAuditLogFields(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      expect(log.id).toBeTruthy();
      expect(log.actorId).toBeTruthy();
      expect(log.action).toBeTruthy();
      expect(log.createdAt).toBeTruthy();
      expect(log.actionLabel?.trim()).not.toEqual("");
      expect(log.actorLabel?.trim()).not.toEqual("");
      expect(log.roleLabel?.trim()).not.toEqual("");
      expect(log.ipAddressLabel?.trim()).not.toEqual("");
      expect(typeof log.detailsLabel).toEqual("string");
      expect(Array.isArray(log.detailsLines)).toBeTruthy();
    });
  }

  validateUuidFields(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      expect(UUID_REGEX.test(log.id)).toBeTruthy();
      expect(UUID_REGEX.test(log.actorId)).toBeTruthy();
      if (log.targetId) {
        expect(UUID_REGEX.test(log.targetId)).toBeTruthy();
      }
    });
  }

  validateEmails(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.actorEmail?.trim()) {
        expect(log.actorEmail).toContain("@");
      }
      if (log.targetEmail?.trim()) {
        expect(log.targetEmail).toContain("@");
      }
    });
  }

  validateRoles(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.actorRoleName?.trim()) {
        expect(log.actorRoleName.trim()).not.toEqual("");
      }
      if (log.targetRoleName?.trim()) {
        expect(log.targetRoleName.trim()).not.toEqual("");
      }
    });
  }

  validateFullNames(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.actorFullName?.trim()) {
        expect(log.actorFullName.trim()).not.toEqual("");
      }
      if (log.targetFullName?.trim()) {
        expect(log.targetFullName.trim()).not.toEqual("");
      }
    });
  }

  validateActions(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      expect(log.action.trim()).not.toEqual("");
      expect(log.action).toContain(".");
    });
  }

  validateIpAddresses(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.ipAddress?.trim()) {
        expect(log.ipAddress.trim()).not.toEqual("");
      }
    });
  }

  validateDetails(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.details !== null) {
        expect(typeof log.details).toBe("object");
      }
    });
  }

  validateCreatedAt(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      expect(ISO_DATE_REGEX.test(log.createdAt)).toBeTruthy();
      expect(Number.isNaN(new Date(log.createdAt).getTime())).toBeFalsy();
    });
  }

  validateUniqueIds(data: AuditLogsData): void {
    const ids = data.logs.map((log) => log.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateNextCursor(data: AuditLogsData): void {
    if (data.total > data.limit && data.logs.length > 0) {
      expect(data.nextCursor).toBeTruthy();
      const lastLog = data.logs[data.logs.length - 1];
      expect(data.nextCursor).toEqual(lastLog.id);
    }
  }

  validateDescendingSort(data: AuditLogsData): void {
    for (let i = 1; i < data.logs.length; i++) {
      const previous = new Date(data.logs[i - 1].createdAt).getTime();
      const current = new Date(data.logs[i].createdAt).getTime();
      expect(current).toBeLessThanOrEqual(previous);
    }
  }

  validateAscendingSort(data: AuditLogsData): void {
    for (let i = 1; i < data.logs.length; i++) {
      const previous = new Date(data.logs[i - 1].createdAt).getTime();
      const current = new Date(data.logs[i].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(previous);
    }
  }

  validateActionFilterOptions(data: AuditLogsData): void {
    expect(data.actionFilterOptions.length).toBeGreaterThan(0);
    const values = data.actionFilterOptions.map((opt) => opt.value);
    expect(new Set(values).size).toEqual(values.length);

    data.actionFilterOptions.forEach((opt) => {
      expect(opt.value.trim()).not.toEqual("");
      expect(opt.label.trim()).not.toEqual("");
      expect(opt.value).toContain(".");
    });
  }

  validateLogActionsInFilterOptions(data: AuditLogsData): void {
    const allowed = new Set(data.actionFilterOptions.map((opt) => opt.value));
    data.logs.forEach((log) => {
      expect(allowed.has(log.action)).toBeTruthy();
    });
  }

  validateDisplayLabels(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.detailsLines.length > 0) {
        expect(log.detailsLabel).not.toEqual("—");
        log.detailsLines.forEach((line) => {
          expect(line.trim()).not.toEqual("");
        });
      }
      if (log.ipAddress === "::1") {
        expect(log.ipAddressLabel.toLowerCase()).toContain("local");
      }
    });
  }

  validateActorLabelMatchesName(data: AuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.actorFullName?.trim()) {
        expect(log.actorLabel).toEqual(log.actorFullName);
      }
    });
  }

  validateNoDataScenario(data: AuditLogsData): void {
    if (data.total === 0) {
      expect(data.logs.length).toBe(0);
      expect(data.nextCursor).toBeNull();
    }
  }
}
