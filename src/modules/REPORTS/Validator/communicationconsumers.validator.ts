import { expect } from "@playwright/test";
import {
  communicationConsumersDefaultLimit,
  communicationConsumersDefaultPage,
  communicationConsumersExpectedColumns,
} from "../Data/communicationconsumers.data";
import type {
  CommunicationConsumersErrorBody,
  CommunicationConsumersResponse,
  CommunicationConsumersRow,
  CommunicationConsumersScenario,
  MappedCommunicationConsumers,
} from "../Mapper/communicationconsumers.mapper";

function isCount(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export class CommunicationConsumersValidator {
  validateResponseEnvelope(response: CommunicationConsumersResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: CommunicationConsumersErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedCommunicationConsumers): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedCommunicationConsumers): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
  }

  validateColumns(mapped: MappedCommunicationConsumers): void {
    expect(mapped.columns.length).toBe(
      communicationConsumersExpectedColumns.length,
    );
    const keys = mapped.columns.map((c) => c.key);
    for (const col of communicationConsumersExpectedColumns) {
      expect(keys).toContain(col.key);
      expect(mapped.columns.find((c) => c.key === col.key)?.header).toBe(
        col.header,
      );
    }
    expect(keys).not.toContain("meterLookupId");
    expect(keys).not.toContain("billingCount");
    expect(keys).not.toContain("billingMappingStatus");
    expect(keys).not.toContain("eventCount");
    expect(keys).not.toContain("slNo");
  }

  validatePaginationEcho(
    mapped: MappedCommunicationConsumers,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedCommunicationConsumers): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  /**
   * Live day/month/range omit COUNT: total/totalPages null while rows exist.
   */
  validatePaginationMath(mapped: MappedCommunicationConsumers): void {
    const { total, totalPages, totalIsExact, hasMore, limit } =
      mapped.pagination;
    const { rows } = mapped;
    if (total == null || totalPages == null) {
      expect(total).toBeNull();
      expect(totalPages).toBeNull();
      if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
      if (hasMore != null) expect(typeof hasMore).toBe("boolean");
      expect(rows.length).toBeGreaterThanOrEqual(0);
      expect(rows.length).toBeLessThanOrEqual(limit);
      return;
    }
    if (total === 0) {
      expect(rows.length).toBe(0);
      expect(totalPages).toBe(0);
      if (hasMore != null) expect(hasMore).toBe(false);
      return;
    }
    expect(totalPages).toBe(Math.ceil(total / limit));
    expect(total).toBeGreaterThanOrEqual(rows.length);
  }

  validateRowsStructure(rows: CommunicationConsumersRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.meterLookupId).toBe("number");
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(typeof row.consumerName).toBe("string");
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.substation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtrName).toBe("string");
      expect(typeof row.address).toBe("string");
      expect(typeof row.ivrsNumber).toBe("string");
      expect(typeof row.tariff).toBe("string");
      expect(typeof row.msn).toBe("string");
      expect(row.msn.trim().length).toBeGreaterThan(0);
      expect(typeof row.phase).toBe("string");
      expect(typeof row.meterMake).toBe("string");
      expect(typeof row.mf).toBe("string");
      expect(isCount(row.ipCount)).toBeTruthy();
      expect(isCount(row.dpCount)).toBeTruthy();
      expect(isCount(row.lsCount)).toBeTruthy();
      if (row.billingCount != null) expect(isCount(row.billingCount)).toBeTruthy();
      if (row.eventCount != null) expect(isCount(row.eventCount)).toBeTruthy();
      if (row.billingMappingStatus != null) {
        expect(typeof row.billingMappingStatus).toBe("string");
      }
    }
  }

  validateRowIds(rows: CommunicationConsumersRow[]): void {
    for (const row of rows) {
      expect(row.id.startsWith("row-")).toBeTruthy();
      expect(row.id).toContain(row.msn);
      expect(row.id).toContain(String(row.meterLookupId));
    }
  }

  /**
   * Same consumer name / DTR on many meters is valid.
   * Duplicate meterLookupId or MSN on one page is a fail.
   */
  validateUniqueMeters(rows: CommunicationConsumersRow[]): void {
    const ids = rows.map((row) => row.id);
    const lookups = rows.map((row) => row.meterLookupId);
    const msns = rows.map((row) => row.msn);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(lookups).size).toBe(lookups.length);
    expect(new Set(msns).size).toBe(msns.length);
  }

  validateLiveOk(
    mapped: MappedCommunicationConsumers,
    page = communicationConsumersDefaultPage,
    limit = communicationConsumersDefaultLimit,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateUniqueMeters(mapped.rows);
    }
  }

  validateLiveDayContract(mapped: MappedCommunicationConsumers): void {
    this.validateLiveOk(mapped, 1, 50);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.msn).toBe("85080223");
    expect(mapped.rows[0]?.meterLookupId).toBe(1095);
    expect(mapped.pagination.total).toBeNull();
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows[0]?.dtrName).toBe(mapped.rows[1]?.dtrName);
    expect(mapped.rows[0]?.msn).not.toBe(mapped.rows[1]?.msn);
  }

  validateEmptyPageContract(mapped: MappedCommunicationConsumers): void {
    this.validateLiveOk(mapped, 1, 50);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePageBeyondLive(mapped: MappedCommunicationConsumers): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    if (mapped.pagination.hasMore === false) {
      expect(mapped.rows.length).toBe(0);
    }
    if (mapped.rows.length > 0) {
      this.validateUniqueMeters(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedCommunicationConsumers,
    scenario: CommunicationConsumersScenario,
    page = communicationConsumersDefaultPage,
    limit = communicationConsumersDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_day":
        this.validateLiveDayContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped);
        break;
      case "dev_live_day":
      case "dev_live_month":
      case "dev_live_range":
      case "dev_ignore_unknown_query":
      case "dev_limit_one":
        this.validateLiveOk(mapped, page, limit);
        break;
      default:
        break;
    }
  }
}
