import { expect } from "@playwright/test";
import {
  MASTER_DATA_AUDIT_ACTIONS,
  MASTER_DATA_AUDIT_DETAIL_KEYS,
} from "../Data/master-data-audit-logs.data";
import type {
  MasterDataAuditLogsData,
  MasterDataAuditLogsQuery,
  MasterDataAuditLogsResponse,
} from "../Mapper/master-data-audit-logs.mapper";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Live master-data audit timestamps are IST (+05:30), not always Z. */
const IST_OR_UTC_ISO =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
const DETAIL_KEY_SET = new Set<string>(MASTER_DATA_AUDIT_DETAIL_KEYS);
const ACTION_SET = new Set<string>(MASTER_DATA_AUDIT_ACTIONS);

export class MasterDataAuditLogsValidator {
  validateResponse(response: MasterDataAuditLogsResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateValidationError(response: MasterDataAuditLogsResponse): void {
    expect(response.success).toBeFalsy();
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe("VALIDATION_ERROR");
    expect(String(response.error?.message ?? "").length).toBeGreaterThan(0);
  }

  validateLogsExist(data: MasterDataAuditLogsData): void {
    expect(Array.isArray(data.logs)).toBeTruthy();
    if (data.total > 0) {
      expect(data.logs.length).toBeGreaterThan(0);
    } else {
      expect(data.logs.length).toBe(0);
    }
  }

  validatePagination(data: MasterDataAuditLogsData): void {
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

  validateQueryParams(
    data: MasterDataAuditLogsData,
    query: MasterDataAuditLogsQuery,
  ): void {
    expect(data.page).toEqual(query.page ?? 1);
    expect(data.limit).toEqual(query.limit ?? 20);
  }

  validateRequiredFields(data: MasterDataAuditLogsData): void {
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

  validateUuidFields(data: MasterDataAuditLogsData): void {
    data.logs.forEach((log) => {
      expect(UUID_REGEX.test(log.id)).toBeTruthy();
      expect(UUID_REGEX.test(log.actorId)).toBeTruthy();
      if (log.targetId) {
        expect(UUID_REGEX.test(log.targetId)).toBeTruthy();
      }
    });
  }

  /** userId is business unique_id (e.g. 0008), not the actor UUID. */
  validateBusinessUserId(data: MasterDataAuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.userId == null || !String(log.userId).trim()) {
        return;
      }
      expect(UUID_REGEX.test(String(log.userId))).toBeFalsy();
      expect(String(log.userId).trim().length).toBeGreaterThan(0);
    });
  }

  validateEmails(data: MasterDataAuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.actorEmail?.trim()) {
        expect(log.actorEmail).toContain("@");
      }
      if (log.targetEmail?.trim()) {
        expect(log.targetEmail).toContain("@");
      }
    });
  }

  validateCreatedAt(data: MasterDataAuditLogsData): void {
    data.logs.forEach((log) => {
      expect(IST_OR_UTC_ISO.test(log.createdAt)).toBeTruthy();
      expect(Number.isNaN(new Date(log.createdAt).getTime())).toBeFalsy();
    });
  }

  validateUniqueIds(data: MasterDataAuditLogsData): void {
    const ids = data.logs.map((log) => log.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateNextCursor(data: MasterDataAuditLogsData): void {
    if (data.total > data.limit && data.logs.length > 0) {
      expect(data.nextCursor).toBeTruthy();
      const lastLog = data.logs[data.logs.length - 1]!;
      expect(data.nextCursor).toEqual(lastLog.id);
    }
  }

  validateDescendingSort(data: MasterDataAuditLogsData): void {
    for (let i = 1; i < data.logs.length; i++) {
      const previous = new Date(data.logs[i - 1]!.createdAt).getTime();
      const current = new Date(data.logs[i]!.createdAt).getTime();
      expect(current).toBeLessThanOrEqual(previous);
    }
  }

  validateAscendingSort(data: MasterDataAuditLogsData): void {
    for (let i = 1; i < data.logs.length; i++) {
      const previous = new Date(data.logs[i - 1]!.createdAt).getTime();
      const current = new Date(data.logs[i]!.createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(previous);
    }
  }

  /**
   * actionFilterOptions must be exactly MASTER_DATA_AUDIT_ACTIONS (UI allowlist).
   */
  validateActionFilterOptions(data: MasterDataAuditLogsData): void {
    expect(data.actionFilterOptions.length).toBe(
      MASTER_DATA_AUDIT_ACTIONS.length,
    );
    const values = data.actionFilterOptions.map((opt) => opt.value);
    expect(values).toEqual([...MASTER_DATA_AUDIT_ACTIONS]);
    expect(new Set(values).size).toEqual(values.length);

    data.actionFilterOptions.forEach((opt) => {
      expect(opt.value.trim()).not.toEqual("");
      expect(opt.label.trim()).not.toEqual("");
      expect(opt.value).toContain(".");
    });
  }

  /** Every log action must be a master-data owned action (no user/auth bleed). */
  validateLogsConstrainedToMasterDataActions(
    data: MasterDataAuditLogsData,
  ): void {
    data.logs.forEach((log) => {
      expect(ACTION_SET.has(log.action)).toBeTruthy();
    });
  }

  validateExactActionFilter(
    data: MasterDataAuditLogsData,
    action: string,
  ): void {
    expect(ACTION_SET.has(action)).toBeTruthy();
    data.logs.forEach((log) => {
      expect(log.action).toBe(action);
    });
  }

  validateActionPrefixFilter(
    data: MasterDataAuditLogsData,
    prefix: string,
  ): void {
    data.logs.forEach((log) => {
      expect(log.action.startsWith(prefix)).toBeTruthy();
      expect(ACTION_SET.has(log.action)).toBeTruthy();
    });
  }

  /** details only contains projected master-data keys. */
  validateProjectedDetails(data: MasterDataAuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.details == null) {
        return;
      }
      expect(typeof log.details).toBe("object");
      for (const key of Object.keys(log.details)) {
        expect(DETAIL_KEY_SET.has(key)).toBeTruthy();
      }
    });
  }

  validateDisplayLabels(data: MasterDataAuditLogsData): void {
    data.logs.forEach((log) => {
      // Backend filters "Changed …" noise lines before display.
      log.detailsLines.forEach((line) => {
        expect(line.trim()).not.toEqual("");
        expect(/^Changed\s+/i.test(line.trim())).toBeFalsy();
      });

      if (log.detailsLines.length === 0) {
        expect(log.detailsLabel).toBe("—");
      } else {
        expect(log.detailsLabel).toBe(log.detailsLines.join(". "));
      }

      if (log.ipAddress === "::1" || log.ipAddress === "127.0.0.1") {
        expect(log.ipAddressLabel.toLowerCase()).toContain("local");
      }
    });
  }

  validateActorLabelMatchesName(data: MasterDataAuditLogsData): void {
    data.logs.forEach((log) => {
      if (log.actorFullName?.trim()) {
        expect(log.actorLabel).toEqual(log.actorFullName);
      }
      if (log.actorRoleName?.trim()) {
        expect(log.roleLabel).toEqual(log.actorRoleName);
      }
    });
  }

  validateNoDataScenario(data: MasterDataAuditLogsData): void {
    if (data.total === 0) {
      expect(data.logs.length).toBe(0);
      expect(data.nextCursor).toBeNull();
    }
  }

  validateLiveOk(
    data: MasterDataAuditLogsData,
    query: MasterDataAuditLogsQuery,
    sortDirection: "desc" | "asc",
  ): void {
    this.validateLogsExist(data);
    this.validatePagination(data);
    this.validateQueryParams(data, query);
    this.validateRequiredFields(data);
    this.validateUuidFields(data);
    this.validateBusinessUserId(data);
    this.validateEmails(data);
    this.validateCreatedAt(data);
    this.validateUniqueIds(data);
    this.validateNextCursor(data);
    this.validateActionFilterOptions(data);
    this.validateLogsConstrainedToMasterDataActions(data);
    this.validateProjectedDetails(data);
    this.validateDisplayLabels(data);
    this.validateActorLabelMatchesName(data);
    this.validateNoDataScenario(data);
    if (sortDirection === "asc") {
      this.validateAscendingSort(data);
    } else {
      this.validateDescendingSort(data);
    }
  }
}
