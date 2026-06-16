import { expect } from "@playwright/test";
import {
  CommandsHistoryData,
  CommandsHistoryResponse,
  CommandsHistoryRow,
} from "../Mapper/commands-history.mapper";

export const COMMAND_HISTORY_STATUSES = [
  "SUCCESS",
  "FAILED",
  "IN_PROGRESS",
  "REJECTED",
] as const;

export const COMMAND_SELECTION_TYPES = ["Single", "Bulk"] as const;

/** Command names observed in hes_command_logs (non-exhaustive). */
export const KNOWN_COMMAND_NAMES = [
  "Get Relay Status",
  "Ping Meter",
  "Get Load Curtailment",
  "Get Profile Period",
  "Get Billing Period",
] as const;

const REQUESTED_TIME_PATTERN =
  /^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$/;

/** Split selected meter field (may contain commas/spaces from bulk input). */
export function parseSelectedMeterTokens(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function parseCommandsHistoryTime(value: string): number {
  const parsed = Date.parse(value);
  expect(Number.isFinite(parsed), `Invalid requestedTime: ${value}`).toBe(
    true,
  );
  return parsed;
}

export class CommandsHistoryValidator {
  validateResponse(body: CommandsHistoryResponse): void {
    expect(body.success).toBe(true);
    expect(body.message?.trim().length).toBeGreaterThan(0);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toBeDefined();
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
      expect(Number.isFinite(row.requestId)).toBe(true);
      expect(row.requestId).toBeGreaterThan(0);
      expect(row.requestedBy).toBe(row.requestedBy.trim());
      expect(row.requestedBy.length).toBeGreaterThan(0);
      expect(row.commandName).toBe(row.commandName.trim());
      expect(row.commandName.length).toBeGreaterThan(0);
      expect(row.selectedMeter).toBe(row.selectedMeter.trim());
      expect(row.selectedMeter.length).toBeGreaterThan(0);
      const meterTokens = parseSelectedMeterTokens(row.selectedMeter);
      expect(
        meterTokens.length,
        `selectedMeter must contain at least one token: ${row.selectedMeter}`,
      ).toBeGreaterThan(0);
      for (const token of meterTokens) {
        expect(
          /^\d+$/.test(token),
          `Invalid meter token "${token}" in selectedMeter: ${row.selectedMeter}`,
        ).toBe(true);
      }
      expect(row.selectionType).toBe(row.selectionType.trim());
      expect(row.selectionType.length).toBeGreaterThan(0);
      expect(row.requestedTime).toBe(row.requestedTime.trim());
      expect(row.requestedTime.length).toBeGreaterThan(0);
      expect(REQUESTED_TIME_PATTERN.test(row.requestedTime)).toBe(true);
      expect(row.status).toBe(row.status.trim());
      expect(row.status.length).toBeGreaterThan(0);
    }
  }

  /** Backend: sno is global row index across pages (page 2 limit 10 → sno 11..20). */
  validateSnoSequence(
    rows: CommandsHistoryRow[],
    page: number,
    limit: number,
  ): void {
    rows.forEach((row, index) => {
      expect(row.sno).toBe((page - 1) * limit + index + 1);
    });
  }

  /** Backend: ORDER BY requested_time DESC */
  validateRequestedTimeDescending(rows: CommandsHistoryRow[]): void {
    for (let i = 0; i < rows.length - 1; i++) {
      const current = parseCommandsHistoryTime(rows[i].requestedTime);
      const next = parseCommandsHistoryTime(rows[i + 1].requestedTime);
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
    const byRequestId = new Map<number, CommandsHistoryRow[]>();
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
    }
  }

  validateStatusReasonRules(rows: CommandsHistoryRow[]): void {
    for (const row of rows) {
      if (row.status === "FAILED" || row.status === "REJECTED") {
        expect(row.reason).toBeTruthy();
        expect(row.reason!.trim().length).toBeGreaterThan(0);
      } else {
        expect(row.reason).toBeNull();
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
   * one exposed field (requestId, commandName, selected, selectionType, status, requestedBy, reason).
   */
  validateSearchFilter(rows: CommandsHistoryRow[], search: string): void {
    const needle = search.trim().toLowerCase();
    expect(needle.length).toBeGreaterThan(0);

    for (const row of rows) {
      const fields = [
        String(row.requestId),
        row.commandName,
        row.selectedMeter,
        row.selectionType,
        row.status,
        row.requestedBy,
        row.reason ?? "",
      ].map((value) => value.toLowerCase());

      const matches = fields.some((value) => value.includes(needle));
      expect(matches, `Row requestId=${row.requestId} must match search`).toBe(
        true,
      );
    }
  }

  /**
   * Backend: command_name ILIKE %commandType% when commandType !== 'All Commands'.
   */
  validateCommandTypeFilter(
    rows: CommandsHistoryRow[],
    commandType: string,
  ): void {
    const needle = commandType.trim().toLowerCase();
    expect(needle.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.commandName.toLowerCase()).toContain(needle);
    }
  }

  validateTotalRecords(
    data: CommandsHistoryData,
    requestedLimit: number,
  ): void {
    const { pagination, rows } = data;
    expect(Number.isInteger(pagination.totalRecords)).toBe(true);
    expect(pagination.totalRecords).toBeGreaterThan(0);
    expect(pagination.totalRecords).toBeGreaterThanOrEqual(rows.length);

    expect(
      (pagination.totalPages - 1) * pagination.limit,
    ).toBeLessThan(pagination.totalRecords);
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
    expect(pagination.totalPages).toBe(
      Math.ceil(pagination.totalRecords / pagination.limit),
    );
    expect(rows.length).toBeLessThanOrEqual(requestedLimit);

    if (pagination.currentPage < pagination.totalPages) {
      expect(rows.length).toBe(requestedLimit);
    }

    if (pagination.currentPage === pagination.totalPages) {
      const expectedLastPageCount =
        pagination.totalRecords -
        (pagination.totalPages - 1) * pagination.limit;
      expect(rows.length).toBe(expectedLastPageCount);
    }

    expect(pagination.hasNextPage).toBe(
      pagination.currentPage < pagination.totalPages,
    );
    expect(pagination.hasPreviousPage).toBe(pagination.currentPage > 1);
  }

  validateFullHistory(
    data: CommandsHistoryData,
    requestedPage: number,
    requestedLimit: number,
  ): void {
    this.validateMessage(data);
    this.validateRowsExist(data);
    this.validateRowFields(data.rows);
    this.validateSnoSequence(data.rows, requestedPage, requestedLimit);
    this.validateRequestedTimeDescending(data.rows);
    this.validateUniqueRowKeys(data.rows);
    this.validateBulkJobRowConsistency(data.rows);
    this.validateStatusValues(data.rows);
    this.validateStatusReasonRules(data.rows);
    this.validateSelectionTypes(data.rows);
    this.validateCommandNames(data.rows);
    this.validateTotalRecords(data, requestedLimit);
    this.validatePaginationFieldTypes(data);
    this.validatePagination(data, requestedPage, requestedLimit);
  }
}
