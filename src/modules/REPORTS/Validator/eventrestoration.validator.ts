import { expect } from "@playwright/test";
import {
  eventRestorationDefaultLimit,
  eventRestorationDefaultPage,
  eventRestorationExpectedColumns,
} from "../Data/eventrestoration.data";
import type {
  EventRestorationErrorBody,
  EventRestorationResponse,
  EventRestorationRow,
  EventRestorationScenario,
  MappedEventRestoration,
} from "../Mapper/eventrestoration.mapper";
import { eventRestorationColumnKeys } from "../Mapper/eventrestoration.mapper";

/** Live: `31-10-2025 05:29`. */
const OCCURRENCE_TIME = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;

export class EventRestorationValidator {
  validateResponseEnvelope(response: EventRestorationResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: EventRestorationErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedEventRestoration): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedEventRestoration): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
    expect(typeof mapped.pagination.total).toBe("number");
    expect(typeof mapped.pagination.totalPages).toBe("number");
  }

  validateColumns(mapped: MappedEventRestoration): void {
    expect(mapped.columns.length).toBe(eventRestorationExpectedColumns.length);
    const keys = mapped.columns.map((column) => column.key);
    for (const expected of eventRestorationExpectedColumns) {
      expect(keys).toContain(expected.key);
      const column = mapped.columns.find((c) => c.key === expected.key);
      expect(column?.header).toBe(expected.header);
      expect(eventRestorationColumnKeys).toContain(expected.key);
    }
  }

  validatePaginationEcho(
    mapped: MappedEventRestoration,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedEventRestoration): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
    expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validatePaginationMath(mapped: MappedEventRestoration): void {
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

  validateRowsStructure(rows: EventRestorationRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
      expect(typeof row.name).toBe("string");
      expect(typeof row.address).toBe("string");
      expect(typeof row.ivrsNumber).toBe("string");
      expect(typeof row.tariff).toBe("string");
      expect(typeof row.msn).toBe("string");
      expect(typeof row.phase).toBe("string");
      expect(typeof row.eventClassificationName).toBe("string");
      expect(typeof row.eventName).toBe("string");
      expect(typeof row.occurrenceTime).toBe("string");
    }
  }

  /** Live ids: `row-{slNo}-{msn}`. */
  validateRowIds(rows: EventRestorationRow[]): void {
    for (const row of rows) {
      expect(row.id).toBe(`row-${row.slNo}-${row.msn}`);
    }
  }

  validateMeterAndEventFields(rows: EventRestorationRow[]): void {
    for (const row of rows) {
      expect(row.msn.trim().length).toBeGreaterThan(0);
      expect(/^\d+$/.test(row.msn.trim())).toBeTruthy();
      expect(row.phase.trim().length).toBeGreaterThan(0);
      expect(row.eventName.trim().length).toBeGreaterThan(0);
      expect(row.eventClassificationName.trim().length).toBeGreaterThan(0);
      expect(OCCURRENCE_TIME.test(row.occurrenceTime)).toBeTruthy();
    }
  }

  validateSlNoSequence(
    rows: EventRestorationRow[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  /**
   * Same MSN / consumer / event name on many rows is valid (repeat occurrences).
   * Duplicate id, slNo, or MSN+occurrenceTime on one page is a fail.
   */
  validateUniqueOccurrences(rows: EventRestorationRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const msnTimes = rows.map((row) => `${row.msn}_${row.occurrenceTime}`);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(msnTimes).size).toBe(msnTimes.length);
  }

  validateNoDataScenario(mapped: MappedEventRestoration): void {
    if (mapped.pagination.total === 0) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validatePageBeyondTotal(
    mapped: MappedEventRestoration,
    requestedPage: number,
  ): void {
    if (
      mapped.pagination.totalPages > 0 &&
      requestedPage > mapped.pagination.totalPages
    ) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validateLiveOk(
    mapped: MappedEventRestoration,
    page = eventRestorationDefaultPage,
    limit = eventRestorationDefaultLimit,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validateNoDataScenario(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateMeterAndEventFields(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueOccurrences(mapped.rows);
    }
  }

  validateLiveFullContract(mapped: MappedEventRestoration): void {
    this.validateLiveOk(mapped);
    expect(mapped.pagination.total).toBe(58342);
    expect(mapped.pagination.totalPages).toBe(5835);
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.msn).toBe("19258966");
    expect(mapped.rows[1]?.msn).toBe("93026985");
    expect(mapped.rows[0]?.eventName).toBe(mapped.rows[1]?.eventName);
    expect(mapped.rows[0]?.id).not.toBe(mapped.rows[1]?.id);
  }

  validateEmptyPageContract(mapped: MappedEventRestoration): void {
    this.validateLiveOk(mapped);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePage2Live(
    mapped: MappedEventRestoration,
    requestedPage: number,
  ): void {
    this.validateLiveOk(mapped, requestedPage, eventRestorationDefaultLimit);
    if (mapped.rows.length > 0) {
      expect(mapped.rows[0]?.slNo).toBeGreaterThan(eventRestorationDefaultLimit);
    }
  }

  validatePageBeyondLive(
    mapped: MappedEventRestoration,
    requestedPage: number,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validatePageBeyondTotal(mapped, requestedPage);
    if (mapped.rows.length > 0) {
      this.validateUniqueOccurrences(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedEventRestoration,
    scenario: EventRestorationScenario,
    page = eventRestorationDefaultPage,
    limit = eventRestorationDefaultLimit,
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
