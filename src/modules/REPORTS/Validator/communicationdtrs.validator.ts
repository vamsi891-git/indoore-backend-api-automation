import { expect } from "@playwright/test";
import {
  communicationDtrsDefaultLimit,
  communicationDtrsDefaultPage,
  communicationDtrsExpectedColumns,
} from "../Data/communicationdtrs.data";
import type {
  CommunicationDtrsErrorBody,
  CommunicationDtrsResponse,
  CommunicationDtrsRow,
  CommunicationDtrsScenario,
  MappedCommunicationDtrs,
} from "../Mapper/communicationdtrs.mapper";

const SERVICE_DATE =
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;
const COORD = /^-?\d+(\.\d+)?$/;

function isCount(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNullableCoord(value: unknown): boolean {
  if (value === null) return true;
  return typeof value === "string" && COORD.test(value);
}

export class CommunicationDtrsValidator {
  validateResponseEnvelope(response: CommunicationDtrsResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: CommunicationDtrsErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedCommunicationDtrs): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedCommunicationDtrs): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
  }

  validateColumns(mapped: MappedCommunicationDtrs): void {
    expect(mapped.columns.length).toBe(communicationDtrsExpectedColumns.length);
    const keys = mapped.columns.map((c) => c.key);
    for (const col of communicationDtrsExpectedColumns) {
      expect(keys).toContain(col.key);
      expect(mapped.columns.find((c) => c.key === col.key)?.header).toBe(
        col.header,
      );
    }
    expect(keys).not.toContain("dtrNetworkLookupId");
    expect(keys).not.toContain("meterLookupId");
    expect(keys).not.toContain("billingCount");
    expect(keys).not.toContain("billingMappingStatus");
    expect(keys).not.toContain("eventCount");
  }

  validatePaginationEcho(
    mapped: MappedCommunicationDtrs,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedCommunicationDtrs): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  /**
   * Live day/month omit COUNT: total/totalPages null while rows exist.
   */
  validatePaginationMath(mapped: MappedCommunicationDtrs): void {
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

  validateRowsStructure(rows: CommunicationDtrsRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(row.slNo).toBeGreaterThan(0);
      expect(typeof row.dtrNetworkLookupId).toBe("number");
      expect(row.dtrNetworkLookupId).toBeGreaterThan(0);
      expect(typeof row.meterLookupId).toBe("number");
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feederName).toBe("string");
      expect(typeof row.dtrName).toBe("string");
      expect(typeof row.feederCode).toBe("string");
      expect(typeof row.dtrCode).toBe("string");
      expect(typeof row.newDtrCode).toBe("string");
      expect(typeof row.dtrCapacity).toBe("string");
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
      expect(typeof row.meterMake).toBe("string");
      expect(typeof row.mf).toBe("string");
      expect(isNullableCoord(row.latitude)).toBeTruthy();
      expect(isNullableCoord(row.longitude)).toBeTruthy();
      expect(typeof row.serviceDate).toBe("string");
      expect(SERVICE_DATE.test(row.serviceDate)).toBeTruthy();
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

  validateRowIds(rows: CommunicationDtrsRow[]): void {
    for (const row of rows) {
      expect(row.id).toBe(
        `row-${row.slNo}-${row.meterSerialNumber}-${row.dtrNetworkLookupId}`,
      );
    }
  }

  /**
   * Same feeder / new DTR code on different DTRs is valid.
   * Duplicate id, slNo, dtrNetworkLookupId, meter serial, or meterLookupId is a fail.
   */
  validateUniqueDtrs(rows: CommunicationDtrsRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const networkIds = rows.map((row) => row.dtrNetworkLookupId);
    const lookups = rows.map((row) => row.meterLookupId);
    const serials = rows.map((row) => row.meterSerialNumber);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(networkIds).size).toBe(networkIds.length);
    expect(new Set(lookups).size).toBe(lookups.length);
    expect(new Set(serials).size).toBe(serials.length);
  }

  validateLiveOk(
    mapped: MappedCommunicationDtrs,
    page = communicationDtrsDefaultPage,
    limit = communicationDtrsDefaultLimit,
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
      this.validateUniqueDtrs(mapped.rows);
    }
  }

  validateLiveMonthContract(mapped: MappedCommunicationDtrs): void {
    this.validateLiveOk(mapped, 1, 50);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.meterSerialNumber).toBe("19271632");
    expect(mapped.rows[0]?.dtrNetworkLookupId).toBe(19);
    expect(mapped.pagination.total).toBeNull();
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows[0]?.feederName).toBe(mapped.rows[1]?.feederName);
    expect(mapped.rows[0]?.meterSerialNumber).not.toBe(
      mapped.rows[1]?.meterSerialNumber,
    );
  }

  validateEmptyPageContract(mapped: MappedCommunicationDtrs): void {
    this.validateLiveOk(mapped, 1, 50);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePageBeyondLive(mapped: MappedCommunicationDtrs): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    if (mapped.pagination.hasMore === false) {
      expect(mapped.rows.length).toBe(0);
    }
    if (mapped.rows.length > 0) {
      this.validateUniqueDtrs(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedCommunicationDtrs,
    scenario: CommunicationDtrsScenario,
    page = communicationDtrsDefaultPage,
    limit = communicationDtrsDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_month":
        this.validateLiveMonthContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped);
        break;
      case "dev_live_month":
      case "dev_live_day":
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
