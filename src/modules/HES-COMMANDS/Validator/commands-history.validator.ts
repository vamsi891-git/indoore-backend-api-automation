import { expect } from "@playwright/test";
import {
  EXPECTED_HISTORY_PAGINATION_KEYS,
  EXPECTED_HISTORY_RESPONSE_KEYS,
  EXPECTED_HISTORY_ROW_KEYS,
} from "../Data/commands-history.data";
import {
  CommandsHistoryData,
  CommandsHistoryResponse,
  CommandsHistoryRow,
} from "../Mapper/commands-history.mapper";

/** Align with GET /commands/history/filters statuses. */
export const COMMAND_HISTORY_STATUSES = [
  "SUCCESS",
  "FAILED",
  "IN_PROGRESS",
  "QUEUED",
  "REJECTED",
  "PARTIAL",
  "STOPPING",
  "STOPPED",
] as const;

export const COMMAND_SELECTION_TYPES = ["Single", "Bulk"] as const;

const REQUESTED_TIME_PATTERN = /^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$/;

/** Split selected meter field (may contain commas/spaces from bulk input). */
export function parseSelectedMeterTokens(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function parseCommandsHistoryTime(value: string): number {
  const parsed = Date.parse(value);
  expect(Number.isFinite(parsed), `Invalid datetime: ${value}`).toBe(true);
  return parsed;
}

export class CommandsHistoryValidator {
  validateResponse(body: CommandsHistoryResponse): void {
    expect(body.success).toBe(true);
    expect(body.message?.trim().length).toBeGreaterThan(0);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toBeDefined();
  }

  validateResponseKeys(body: object): void {
    const keys = Object.keys(body).filter((k) => k !== "error");
    expect(keys.sort()).toEqual([...EXPECTED_HISTORY_RESPONSE_KEYS].sort());
  }

  validatePaginationKeys(pagination: object): void {
    expect(Object.keys(pagination).sort()).toEqual([...EXPECTED_HISTORY_PAGINATION_KEYS].sort());
  }

  validateRowKeys(rawRows: object[]): void {
    for (const row of rawRows) {
      expect(Object.keys(row).sort()).toEqual([...EXPECTED_HISTORY_ROW_KEYS].sort());
    }
  }

  validateMessage(data: CommandsHistoryData): void {
    expect(data.message.length).toBeGreaterThan(0);
  }

  validateRowsExist(data: CommandsHistoryData): void {
    expect(data.rows.length).toBeGreaterThan(0);
  }

  validateRowFields(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      expect(row.sno).toBeGreaterThan(0);
      expect(Number.isInteger(row.sno)).toBe(true);
      expect(row.requestId).toBe(row.requestId.trim());
      expect(row.requestId.length).toBeGreaterThan(0);
      expect(/^\d+$/.test(row.requestId)).toBe(true);
      expect(row.jobName.length).toBeGreaterThan(0);
      expect(row.requestedBy.length).toBeGreaterThan(0);
      expect(row.uniqueId.length).toBeGreaterThan(0);
      expect(row.commandName.length).toBeGreaterThan(0);
      expect(row.selectedMeter.length).toBeGreaterThan(0);
      expect(row.meterSerialNumber.length).toBeGreaterThan(0);

      const meterTokens = parseSelectedMeterTokens(row.selectedMeter);
      expect(meterTokens.length).toBeGreaterThan(0);
      for (const token of meterTokens) {
        expect(/^[A-Za-z0-9._-]+$/.test(token)).toBe(true);
      }

      expect(row.selectionType.length).toBeGreaterThan(0);
      expect(REQUESTED_TIME_PATTERN.test(row.requestedTime)).toBe(true);
      expect(Number.isFinite(Date.parse(row.requestedAt))).toBe(true);
      expect(row.status.length).toBeGreaterThan(0);
      expect(row.overallStatus.length).toBeGreaterThan(0);
      expect(typeof row.statusUpdateDelayed).toBe("boolean");
      expect(typeof row.isRetryScheduled).toBe("boolean");
      expect(Array.isArray(row.meterResponseRows)).toBe(true);
    }
  }

  validateMeterIdentity(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      if (row.selectionType === "Single") {
        expect(row.selectedMeter).toBe(row.meterSerialNumber);
        expect(row.totalMeters).toBe(1);
      }
      if (row.bulkJobId == null) {
        expect(row.jobName).toBe(row.requestId);
      }
    }
  }

  validateMeterCounts(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      expect(row.totalMeters).toBeGreaterThanOrEqual(0);
      expect(row.processedMeters).toBeGreaterThanOrEqual(0);
      expect(row.successfulMeters).toBeGreaterThanOrEqual(0);
      expect(row.failedMeters).toBeGreaterThanOrEqual(0);
      expect(row.pendingMeters).toBeGreaterThanOrEqual(0);
      expect(row.stoppedMeters).toBeGreaterThanOrEqual(0);

      expect(row.successfulMeters + row.failedMeters + row.pendingMeters + row.stoppedMeters).toBe(
        row.totalMeters,
      );

      expect(row.processedMeters).toBeLessThanOrEqual(row.totalMeters);
    }
  }

  validateTimingFields(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      if (row.startedAt != null) {
        expect(Number.isFinite(Date.parse(row.startedAt))).toBe(true);
      }
      if (row.completedAt != null) {
        expect(Number.isFinite(Date.parse(row.completedAt))).toBe(true);
      }
      if (row.startedAt != null && row.completedAt != null) {
        expect(Date.parse(row.completedAt)).toBeGreaterThanOrEqual(Date.parse(row.startedAt));
      }
      if (row.executionDurationMs != null) {
        expect(row.executionDurationMs).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(row.executionDurationMs)).toBe(true);
      }
      if (row.executionDeadlineAt != null) {
        expect(Number.isFinite(Date.parse(row.executionDeadlineAt))).toBe(true);
      }
      if (row.status === "SUCCESS" && row.executionDurationMs != null) {
        expect(row.completedAt).toBeTruthy();
        expect(row.startedAt).toBeTruthy();
      }
    }
  }

  validateMeterResponseRows(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      for (const item of row.meterResponseRows) {
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.value.length).toBeGreaterThan(0);
      }
      if (row.meterResponseRows.length > 0) {
        expect(row.meterResponse).toBeTruthy();
      }
    }
  }

  /** Backend: sno is global row index across pages (page 2 limit 10 → sno 11..20). */
  validateSnoSequence(rows: CommandsHistoryRow[], page: number, limit: number): void {
    rows.forEach((row, index) => {
      expect(row.sno).toBe((page - 1) * limit + index + 1);
    });
  }

  /** Prefer ISO requestedAt for stable DESC ordering. */
  validateRequestedTimeDescending(rows: CommandsHistoryRow[]): void {
    for (let i = 0; i < rows.length - 1; i++) {
      const current = parseCommandsHistoryTime(rows[i].requestedAt);
      const next = parseCommandsHistoryTime(rows[i + 1].requestedAt);
      expect(current).toBeGreaterThanOrEqual(next);
    }
  }

  /**
   * hes_command_logs has one row per meter per request — bulk jobs share requestId
   * across meters, so uniqueness is per (requestId, selectedMeter), not requestId alone.
   */
  validateUniqueRowKeys(rows: CommandsHistoryRow[]): void {
    const keys = rows.map((row) => {
      const primaryMeter = parseSelectedMeterTokens(row.selectedMeter)[0] ?? row.selectedMeter;
      return `${row.requestId}:${primaryMeter}`;
    });
    expect(new Set(keys).size).toBe(keys.length);
  }

  /** Rows sharing a requestId must be Bulk with matching command/user/time. */
  validateBulkJobRowConsistency(rows: CommandsHistoryRow[]): void {
    const byRequestId = new Map<string, CommandsHistoryRow[]>();
    for (const row of rows) {
      const group = byRequestId.get(row.requestId) ?? [];
      group.push(row);
      byRequestId.set(row.requestId, group);
    }

    for (const [, group] of byRequestId) {
      if (group.length === 1) {
        continue;
      }

      const first = group[0];
      for (const row of group) {
        expect(row.selectionType).toBe("Bulk");
        expect(row.commandName).toBe(first.commandName);
        expect(row.requestedBy).toBe(first.requestedBy);
        expect(row.requestedTime).toBe(first.requestedTime);
      }
    }
  }

  validateStatusValues(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      expect(COMMAND_HISTORY_STATUSES).toContain(row.status);
      expect(COMMAND_HISTORY_STATUSES).toContain(row.overallStatus);
    }
  }

  validateStatusReasonRules(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      if (row.status === "FAILED" || row.status === "REJECTED") {
        const detail = row.reason ?? row.failureReason ?? row.message;
        expect(detail).toBeTruthy();
        expect(String(detail).trim().length).toBeGreaterThan(0);
      } else if (row.status === "PARTIAL") {
        if (row.reason != null) {
          expect(row.reason.trim().length).toBeGreaterThan(0);
        }
      } else if (
        row.status === "SUCCESS" ||
        row.status === "QUEUED" ||
        row.status === "IN_PROGRESS"
      ) {
        expect(row.reason).toBeNull();
        expect(row.failureCode).toBeNull();
        expect(row.failureReason).toBeNull();
      }
    }
  }

  validateSelectionTypes(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      expect(COMMAND_SELECTION_TYPES).toContain(
        row.selectionType as (typeof COMMAND_SELECTION_TYPES)[number],
      );
    }
  }

  validateCommandNames(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      expect(row.commandName.length).toBeGreaterThan(0);
    }
  }

  /**
   * Backend search OR filter — each row must match the search needle on at least
   * one exposed field.
   */
  validateSearchFilter(rows: CommandsHistoryRow[], search: string): void {
    const needle = search.trim().toLowerCase();
    expect(needle.length).toBeGreaterThan(0);

    for (const row of rows) {
      const fields = [
        String(row.requestId),
        row.commandName,
        row.selectedMeter,
        row.meterSerialNumber,
        row.selectionType,
        row.status,
        row.requestedBy,
        row.reason ?? "",
        row.message ?? "",
      ].map((value) => value.toLowerCase());

      const matches = fields.some((value) => value.includes(needle));
      expect(matches, `Row requestId=${row.requestId} must match search`).toBe(true);
    }
  }

  /**
   * Backend: command_name ILIKE %commandType% when commandType !== 'All Commands'.
   */
  validateCommandTypeFilter(rows: CommandsHistoryRow[], commandType: string): void {
    const needle = commandType.trim().toLowerCase();
    expect(needle.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.commandName.toLowerCase()).toContain(needle);
    }
  }

  validateTotalRecords(data: CommandsHistoryData, requestedLimit: number): void {
    const { pagination, rows } = data;
    expect(Number.isInteger(pagination.totalRecords)).toBe(true);
    expect(pagination.totalRecords).toBeGreaterThanOrEqual(0);
    expect(pagination.totalRecords).toBeGreaterThanOrEqual(rows.length);

    if (pagination.totalRecords === 0) {
      expect(rows.length).toBe(0);
      return;
    }

    expect((pagination.totalPages - 1) * pagination.limit).toBeLessThan(pagination.totalRecords);
    expect(pagination.totalPages * pagination.limit).toBeGreaterThanOrEqual(
      pagination.totalRecords,
    );

    if (rows.length === requestedLimit && pagination.currentPage === 1) {
      expect(pagination.totalRecords).toBeGreaterThanOrEqual(requestedLimit);
    }
  }

  validatePaginationFieldTypes(data: CommandsHistoryData): void {
    const { pagination } = data;
    expect(Number.isInteger(pagination.currentPage)).toBe(true);
    expect(Number.isInteger(pagination.totalPages)).toBe(true);
    expect(Number.isInteger(pagination.totalRecords)).toBe(true);
    expect(Number.isInteger(pagination.limit)).toBe(true);
    expect(typeof pagination.hasNextPage).toBe("boolean");
    expect(typeof pagination.hasPreviousPage).toBe("boolean");
  }

  validatePagination(
    data: CommandsHistoryData,
    requestedPage: number,
    requestedLimit: number,
  ): void {
    const { pagination, rows } = data;
    expect(pagination.currentPage).toBe(requestedPage);
    expect(pagination.limit).toBe(requestedLimit);
    expect(pagination.totalRecords).toBeGreaterThanOrEqual(rows.length);
    expect(pagination.totalPages).toBe(Math.ceil(pagination.totalRecords / pagination.limit));
    expect(rows.length).toBeLessThanOrEqual(requestedLimit);

    if (pagination.currentPage < pagination.totalPages) {
      expect(rows.length).toBe(requestedLimit);
    }

    if (pagination.currentPage === pagination.totalPages) {
      const expectedLastPageCount =
        pagination.totalRecords - (pagination.totalPages - 1) * pagination.limit;
      expect(rows.length).toBe(expectedLastPageCount);
    }

    expect(pagination.hasNextPage).toBe(pagination.currentPage < pagination.totalPages);
    expect(pagination.hasPreviousPage).toBe(pagination.currentPage > 1);
  }

  validateFullHistory(
    data: CommandsHistoryData,
    requestedPage: number,
    requestedLimit: number,
    rawBody?: CommandsHistoryResponse,
  ): void {
    if (rawBody) {
      this.validateResponseKeys(rawBody);
      if (rawBody.pagination) {
        this.validatePaginationKeys(rawBody.pagination);
      }
      if (rawBody.data) {
        this.validateRowKeys(rawBody.data);
      }
    }
    this.validateMessage(data);
    this.validatePaginationFieldTypes(data);
    this.validateTotalRecords(data, requestedLimit);

    // Empty history is valid (fresh env / no commands yet) — skip row contract.
    if (data.rows.length === 0) {
      expect(data.pagination.totalRecords).toBe(0);
      expect(data.pagination.hasPreviousPage).toBe(false);
      expect(data.pagination.hasNextPage).toBe(false);
      return;
    }

    this.validateRowsExist(data);
    this.validateRowFields(data.rows);
    this.validateMeterIdentity(data.rows);
    this.validateMeterCounts(data.rows);
    this.validateTimingFields(data.rows);
    this.validateMeterResponseRows(data.rows);
    this.validateSnoSequence(data.rows, requestedPage, requestedLimit);
    this.validateRequestedTimeDescending(data.rows);
    this.validateUniqueRowKeys(data.rows);
    this.validateBulkJobRowConsistency(data.rows);
    this.validateStatusValues(data.rows);
    this.validateStatusReasonRules(data.rows);
    this.validateSelectionTypes(data.rows);
    this.validateCommandNames(data.rows);
    this.validatePagination(data, requestedPage, requestedLimit);
  }
}
