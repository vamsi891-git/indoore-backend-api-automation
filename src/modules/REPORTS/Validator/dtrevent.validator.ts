import { expect } from "@playwright/test";
import {
  dtrEventDefaultLimit,
  dtrEventDefaultPage,
  dtrEventExpectedColumns,
} from "../Data/dtrevent.data";
import type {
  DtrEventErrorBody,
  DtrEventResponse,
  DtrEventRow,
  DtrEventScenario,
  MappedDtrEvent,
} from "../Mapper/dtrevent.mapper";
import { dtrEventColumnKeys } from "../Mapper/dtrevent.mapper";

/** Live: `173:24:00`, `07:02:00` (hours may exceed 24). */
const DURATION_HH_MM_SS = /^\d+:\d{2}:\d{2}$/;

function parseDurationHhMmSs(value: string): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const [hours, minutes, seconds] = value.split(":").map(Number);
  return { hours, minutes, seconds };
}

export class DtrEventValidator {
  validateResponseEnvelope(response: DtrEventResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: DtrEventErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedDtrEvent): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedDtrEvent): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
    expect(typeof mapped.pagination.total).toBe("number");
    expect(typeof mapped.pagination.totalPages).toBe("number");
  }

  validateColumns(mapped: MappedDtrEvent): void {
    expect(mapped.columns.length).toBe(dtrEventExpectedColumns.length);
    const keys = mapped.columns.map((column) => column.key);
    for (const expected of dtrEventExpectedColumns) {
      expect(keys).toContain(expected.key);
      const column = mapped.columns.find((c) => c.key === expected.key);
      expect(column?.header).toBe(expected.header);
      expect(dtrEventColumnKeys).toContain(expected.key);
    }
    expect(keys).not.toContain("dtrNetworkLookupId");
    expect(keys).not.toContain("meterLookupId");
    expect(keys).not.toContain("eventId");
  }

  validatePaginationEcho(
    mapped: MappedDtrEvent,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedDtrEvent): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
    expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validatePaginationMath(mapped: MappedDtrEvent): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } =
      mapped.pagination;
    const { rows } = mapped;
    if (total === 0) {
      expect(rows.length).toBe(0);
      expect(totalPages).toBe(0);
      if (hasMore != null) expect(hasMore).toBe(false);
      return;
    }
    expect(totalPages).toBe(Math.ceil(total / limit));
    expect(total).toBeGreaterThanOrEqual(rows.length);
    if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
    if (hasMore != null) expect(hasMore).toBe(page < totalPages);
  }

  validateRowsLimit(mapped: MappedDtrEvent): void {
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validateNoDataScenario(mapped: MappedDtrEvent): void {
    if (mapped.pagination.total === 0) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validatePageBeyondTotal(
    mapped: MappedDtrEvent,
    requestedPage: number,
  ): void {
    if (
      mapped.pagination.totalPages > 0 &&
      requestedPage > mapped.pagination.totalPages
    ) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validateRowsStructure(rows: DtrEventRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dt).toBe("string");
      expect(typeof row.dtrMeterNo).toBe("string");
      expect(
        row.dtrRatingKva == null || typeof row.dtrRatingKva === "number",
      ).toBeTruthy();
      expect(typeof row.eventCount).toBe("number");
      expect(typeof row.durationHhMmSs).toBe("string");
      expect(typeof row.dtrNetworkLookupId).toBe("number");
      expect(typeof row.meterLookupId).toBe("number");
      expect(typeof row.eventId).toBe("number");
    }
  }

  /** Live ids: `row-{slNo}-{dtrNetworkLookupId}-{dtrMeterNo}`. */
  validateRowIds(rows: DtrEventRow[]): void {
    for (const row of rows) {
      expect(row.id).toBe(
        `row-${row.slNo}-${row.dtrNetworkLookupId}-${row.dtrMeterNo}`,
      );
    }
  }

  validateDtrIdentity(rows: DtrEventRow[]): void {
    for (const row of rows) {
      expect(row.dt.trim().length).toBeGreaterThan(0);
      expect(row.dtrNetworkLookupId!).toBeGreaterThan(0);
      expect(row.meterLookupId!).toBeGreaterThan(0);
      expect(row.eventId!).toBeGreaterThan(0);
    }
  }

  validateEventMetrics(rows: DtrEventRow[]): void {
    for (const row of rows) {
      expect(row.eventCount).toBeGreaterThanOrEqual(0);
      if (row.eventCount > 0) {
        expect(row.durationHhMmSs).not.toBe("");
      }
    }
  }

  validateDurationFormat(rows: DtrEventRow[]): void {
    for (const row of rows) {
      const duration = row.durationHhMmSs.trim();
      expect(DURATION_HH_MM_SS.test(duration)).toBeTruthy();
      const { hours, minutes, seconds } = parseDurationHhMmSs(duration);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(60);
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThan(60);
    }
  }

  validateMeterNumber(rows: DtrEventRow[]): void {
    for (const row of rows) {
      expect(row.dtrMeterNo.trim().length).toBeGreaterThan(0);
      expect(/^\d+$/.test(row.dtrMeterNo.trim())).toBeTruthy();
    }
  }

  validateSlNoSequence(
    rows: DtrEventRow[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  /**
   * Same feeder / eventId on many DTRs is valid.
   * Duplicate id, slNo, dtrNetworkLookupId, meter serial, or meterLookupId is a fail.
   */
  validateUniqueDtrs(rows: DtrEventRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const networkIds = rows.map((row) => row.dtrNetworkLookupId);
    const meters = rows.map((row) => row.dtrMeterNo);
    const lookups = rows.map((row) => row.meterLookupId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(networkIds).size).toBe(networkIds.length);
    expect(new Set(meters).size).toBe(meters.length);
    expect(new Set(lookups).size).toBe(lookups.length);
  }

  validateLiveOk(
    mapped: MappedDtrEvent,
    page = dtrEventDefaultPage,
    limit = dtrEventDefaultLimit,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validateRowsLimit(mapped);
    this.validateNoDataScenario(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateDtrIdentity(mapped.rows);
      this.validateEventMetrics(mapped.rows);
      this.validateDurationFormat(mapped.rows);
      this.validateMeterNumber(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueDtrs(mapped.rows);
    }
  }

  validateLiveFullContract(mapped: MappedDtrEvent): void {
    this.validateLiveOk(mapped);
    expect(mapped.pagination.total).toBe(794);
    expect(mapped.pagination.totalPages).toBe(80);
    expect(mapped.pagination.totalIsExact).toBe(true);
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.dtrMeterNo).toBe("19271401");
    expect(mapped.rows[0]?.dtrRatingKva).toBeNull();
    expect(mapped.rows[1]?.dtrRatingKva).toBe(100);
    expect(mapped.rows[0]?.eventId).toBe(mapped.rows[1]?.eventId);
    expect(mapped.rows[0]?.dtrNetworkLookupId).not.toBe(
      mapped.rows[1]?.dtrNetworkLookupId,
    );
  }

  validateEmptyPageContract(mapped: MappedDtrEvent): void {
    this.validateLiveOk(mapped);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePage2Live(mapped: MappedDtrEvent, requestedPage: number): void {
    this.validateLiveOk(mapped, requestedPage, dtrEventDefaultLimit);
    if (mapped.rows.length > 0) {
      expect(mapped.rows[0]?.slNo).toBeGreaterThan(dtrEventDefaultLimit);
    }
  }

  validatePageBeyondLive(
    mapped: MappedDtrEvent,
    requestedPage: number,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validatePageBeyondTotal(mapped, requestedPage);
    if (mapped.rows.length > 0) {
      this.validateUniqueDtrs(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedDtrEvent,
    scenario: DtrEventScenario,
    page = dtrEventDefaultPage,
    limit = dtrEventDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_full":
        this.validateLiveFullContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page2":
        this.validatePage2Live(mapped, page);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped, page);
        break;
      case "dev_live_primary":
      case "dev_ignore_unknown_query":
      case "dev_limit_one":
        this.validateLiveOk(mapped, page, limit);
        break;
      default:
        break;
    }
  }
}
