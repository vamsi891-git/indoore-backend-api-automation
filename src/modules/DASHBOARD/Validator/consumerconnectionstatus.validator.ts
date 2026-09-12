import { expect } from "@playwright/test";
import {
  CONSUMER_CONNECTION_STATUS_COLUMN_KEYS,
  CONSUMER_CONNECTION_STATUS_LABELS,
  consumerConnectionStatusAccessTokenInvalidMessage,
  consumerConnectionStatusSuccessMessage,
  consumerConnectionStatusUnauthorizedMessage,
  statusForScenario,
} from "../Data/consumerconnectionstatus.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { ConsumerConnectionStatusQuery } from "../Api/consumerconnectionstatus.api";
import type {
  ConsumerConnectionStatus,
  ConsumerConnectionStatusErrorResponse,
  ConsumerConnectionStatusResponse,
  ConsumerConnectionStatusScenario,
  MappedConsumerConnectionStatus,
} from "../Mapper/consumerconnectionstatus.mapper";

function normalizeStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function statusMatchesQuery(
  connectionStatus: unknown,
  status: ConsumerConnectionStatus,
): boolean {
  const actual = normalizeStatus(connectionStatus);
  if (!actual) return false;
  const expected = normalizeStatus(CONSUMER_CONNECTION_STATUS_LABELS[status]);
  if (actual === expected) return true;
  // Permanent Disconnection / Permanently Disconnected aliases
  if (status === "permanently-disconnected") {
    return (
      actual.includes("permanent") && actual.includes("disconnect")
    );
  }
  return actual === normalizeStatus(status);
}

export class ConsumerConnectionStatusValidator {
  validateResponseEnvelope(
    response: ConsumerConnectionStatusResponse,
  ): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data?.columns)).toBeTruthy();
    expect(Array.isArray(response.data?.rows)).toBeTruthy();
    expect(response.data?.pagination).toBeDefined();
    if (response.message != null) {
      expect(response.message).toBe(consumerConnectionStatusSuccessMessage);
    }
  }

  validateColumns(mapped: MappedConsumerConnectionStatus): void {
    expect(mapped.columns.length).toBe(
      CONSUMER_CONNECTION_STATUS_COLUMN_KEYS.length,
    );
    const keys = mapped.columns.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    mapped.columns.forEach((column) => {
      expect(column.key).toBeTruthy();
      expect(column.header).toBeTruthy();
    });
    expect(keys).toEqual([...CONSUMER_CONNECTION_STATUS_COLUMN_KEYS]);
  }

  /**
   * Every column key must exist on each row. Row-only `id` / `manufacturerName`
   * are allowed (omitted from column metadata).
   */
  validateColumnKeysMatchRows(mapped: MappedConsumerConnectionStatus): void {
    const columnKeys = mapped.columns.map((c) => c.key);
    for (const row of mapped.rows) {
      for (const key of columnKeys) {
        expect(Object.prototype.hasOwnProperty.call(row, key)).toBe(true);
      }
      if (row.id != null) {
        expect(String(row.id).trim().length).toBeGreaterThan(0);
      }
    }
  }

  validateRowShapes(
    mapped: MappedConsumerConnectionStatus,
    status: ConsumerConnectionStatus,
  ): void {
    for (const row of mapped.rows) {
      expect(Number(row.slNo)).toBeGreaterThan(0);
      expect(String(row.consumerName ?? "").trim().length).toBeGreaterThan(0);
      expect(String(row.ivrs ?? "").trim().length).toBeGreaterThan(0);
      expect(
        String(row.meterSerialNumber ?? "").trim().length,
      ).toBeGreaterThan(0);
      expect(statusMatchesQuery(row.connectionStatus, status)).toBeTruthy();
      if (row.serviceDate != null) {
        expect(String(row.serviceDate).trim().length).toBeGreaterThan(0);
      }
    }
  }

  validatePagination(
    mapped: MappedConsumerConnectionStatus,
    query: ConsumerConnectionStatusQuery,
  ): void {
    const { page, limit, total, totalPages } = mapped.pagination;
    expect(page).toBe(query.page ?? 1);
    expect(limit).toBe(query.limit ?? 20);
    expect(page).toBeGreaterThan(0);
    expect(limit).toBeGreaterThan(0);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(totalPages).toBeGreaterThanOrEqual(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(limit);

    if (total === 0) {
      expect(totalPages).toBe(0);
      expect(mapped.rows.length).toBe(0);
      return;
    }

    expect(totalPages).toBe(Math.ceil(total / limit));
    if (totalPages === 1) {
      expect(total).toBe(mapped.rows.length);
    }
    if (page < totalPages) {
      expect(mapped.rows.length).toBe(limit);
    } else if (page === totalPages) {
      const remainder = total % limit;
      const expectedRows = remainder === 0 ? limit : remainder;
      expect(mapped.rows.length).toBe(expectedRows);
    }
  }

  validateLiveOk(
    mapped: MappedConsumerConnectionStatus,
    query: ConsumerConnectionStatusQuery,
  ): void {
    expect(mapped.success).toBeTruthy();
    this.validateColumns(mapped);
    this.validatePagination(mapped, query);
    this.validateColumnKeysMatchRows(mapped);
    this.validateRowShapes(mapped, query.status);
  }

  validateEmptyContract(mapped: MappedConsumerConnectionStatus): void {
    this.validateColumns(mapped);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.pagination.totalPages).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validateWithRowsContract(
    mapped: MappedConsumerConnectionStatus,
    status: ConsumerConnectionStatus,
  ): void {
    this.validateColumns(mapped);
    expect(mapped.pagination.total).toBe(1);
    expect(mapped.pagination.totalPages).toBe(1);
    expect(mapped.rows.length).toBe(1);
    this.validateColumnKeysMatchRows(mapped);
    this.validateRowShapes(mapped, status);
    expect(mapped.rows[0]?.id).toBe("meter-10");
    expect(mapped.rows[0]?.meterSerialNumber).toBe("20151631");
    expect(mapped.rows[0]?.connectionStatus).toBe(
      CONSUMER_CONNECTION_STATUS_LABELS[status],
    );
  }

  validateAuthError(
    responseBody: ConsumerConnectionStatusErrorResponse,
    expectedCode: string,
    expectedMessage: string,
  ): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe(expectedCode);
    expect(responseBody.error.message.toLowerCase()).toContain(
      expectedMessage.toLowerCase(),
    );
  }

  validateUnauthorizedError(
    responseBody: ConsumerConnectionStatusErrorResponse,
  ): void {
    this.validateAuthError(
      responseBody,
      dtrUnbalanceUnauthorizedCode,
      consumerConnectionStatusUnauthorizedMessage,
    );
  }

  validateAccessTokenInvalidError(
    responseBody: ConsumerConnectionStatusErrorResponse,
  ): void {
    this.validateAuthError(
      responseBody,
      dtrUnbalanceAccessTokenInvalidCode,
      consumerConnectionStatusAccessTokenInvalidMessage,
    );
  }

  validateScenario(
    mapped: MappedConsumerConnectionStatus,
    scenario: ConsumerConnectionStatusScenario,
    query?: ConsumerConnectionStatusQuery,
  ): void {
    const status = statusForScenario(scenario);
    const effectiveQuery: ConsumerConnectionStatusQuery = query ?? {
      status,
      page: 1,
      limit: 20,
    };

    switch (scenario) {
      case "contract_connected_empty":
        this.validateEmptyContract(mapped);
        break;
      case "contract_connected":
      case "contract_disconnected":
      case "contract_permanently_disconnected":
        this.validateWithRowsContract(mapped, status);
        break;
      case "dev_live_connected":
      case "dev_live_disconnected":
      case "dev_live_permanently_disconnected":
      case "dev_live_page_limit":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, effectiveQuery);
        break;
      default:
        break;
    }
  }
}
