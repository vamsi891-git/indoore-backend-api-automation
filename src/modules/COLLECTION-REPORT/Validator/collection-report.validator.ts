import { expect } from "@playwright/test";
import {
  collectionReportDefaultLimit,
  collectionReportDefaultPage,
  expectedColumnsForReportType,
  EXPECTED_COLLECTION_REPORT_GASP_COLUMN_PREFIX,
  type CollectionReportType,
} from "../Data/collection-report.data";
import type {
  CollectionReportErrorBody,
  CollectionReportResponse,
  CollectionReportRow,
  CollectionReportScenario,
  MappedCollectionReport,
} from "../Mapper/collection-report.mapper";
import { CollectionReportSuccessResponseSchema } from "../schemas/collection-report.schemas";

const DURATION_HH_MM = /^\d+:\d{2}$/;

function parseDuration(value: string): { hours: number; minutes: number } {
  const [hours, minutes] = value.split(":").map(Number);
  return { hours, minutes };
}

export class CollectionReportValidator {
  validateResponseEnvelope(response: CollectionReportResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateZodSuccess(response: CollectionReportResponse): void {
    const parsed = CollectionReportSuccessResponseSchema.safeParse(response);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
  }

  validateValidationError(responseBody: CollectionReportErrorBody, messageIncludes?: string): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
    if (messageIncludes) {
      expect(String(responseBody.error?.message).toLowerCase()).toContain(
        messageIncludes.toLowerCase(),
      );
    }
  }

  validateGaspRangeError(responseBody: CollectionReportErrorBody): void {
    this.validateValidationError(responseBody, "single date");
  }

  validateSuccess(mapped: MappedCollectionReport): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedCollectionReport): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
    expect(typeof mapped.pagination.total).toBe("number");
    expect(typeof mapped.pagination.totalPages).toBe("number");
  }

  validateColumns(mapped: MappedCollectionReport, reportType: CollectionReportType): void {
    const expected = expectedColumnsForReportType(reportType);
    if (expected == null) {
      // GASP: require hierarchy prefix when columns are present.
      expect(mapped.columns.length).toBeGreaterThan(0);
      const keys = mapped.columns.map((c) => c.key);
      for (const col of EXPECTED_COLLECTION_REPORT_GASP_COLUMN_PREFIX) {
        expect(keys).toContain(col.key);
        const found = mapped.columns.find((c) => c.key === col.key);
        expect(found?.header).toBe(col.header);
      }
      return;
    }

    expect(mapped.columns.length).toBe(expected.length);
    const keys = mapped.columns.map((column) => column.key);
    for (const col of expected) {
      expect(keys).toContain(col.key);
      const found = mapped.columns.find((c) => c.key === col.key);
      expect(found?.header).toBe(col.header);
    }
  }

  validatePaginationEcho(mapped: MappedCollectionReport, page: number, limit: number): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedCollectionReport): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
    expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  /**
   * `pagination.total` is the scoped meter universe, not matching-row count.
   * Prefer metersFetched / hasMore / nextMeterLookupId for scan progress.
   */
  validateScanMeta(mapped: MappedCollectionReport): void {
    if (mapped.metersFetched != null) {
      expect(mapped.metersFetched).toBeGreaterThanOrEqual(0);
      expect(mapped.metersFetched).toBeLessThanOrEqual(mapped.pagination.limit);
      expect(mapped.rows.length).toBeLessThanOrEqual(mapped.metersFetched);
    }
    if (mapped.hasMore === true) {
      expect(mapped.nextMeterLookupId).toBeGreaterThan(0);
    }
    if (
      mapped.pagination.hasMore != null &&
      mapped.hasMore != null &&
      mapped.metersFetched != null
    ) {
      // Top-level hasMore and pagination.hasMore should agree when both set.
      expect(mapped.hasMore).toBe(mapped.pagination.hasMore);
    }
  }

  validatePaginationMath(mapped: MappedCollectionReport): void {
    const { total, limit, totalPages } = mapped.pagination;
    if (total === 0) {
      expect(totalPages).toBe(0);
      return;
    }
    expect(totalPages).toBe(Math.ceil(total / limit));
  }

  validateRowsLimit(mapped: MappedCollectionReport): void {
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validateRowsStructure(rows: CollectionReportRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.meterLookupId).toBe("number");
      expect(Number(row.meterLookupId)).toBeGreaterThan(0);
      expect(String(row.meterSerialNumber ?? "").trim().length).toBeGreaterThan(0);
      expect(String(row.circle ?? "").trim().length).toBeGreaterThan(0);
      if (row.durationHhMm != null && row.durationHhMm !== "") {
        expect(DURATION_HH_MM.test(String(row.durationHhMm))).toBeTruthy();
        const { hours, minutes } = parseDuration(String(row.durationHhMm));
        expect(hours).toBeGreaterThanOrEqual(0);
        expect(minutes).toBeGreaterThanOrEqual(0);
        expect(minutes).toBeLessThan(60);
      }
      if (row.eventCount != null) {
        expect(Number(row.eventCount)).toBeGreaterThanOrEqual(0);
      }
      if (row.ipCount != null) {
        expect(Number(row.ipCount)).toBeGreaterThanOrEqual(0);
      }
    }
  }

  /**
   * Matching rows are numbered consecutively within the response.
   * Page offset does not always continue global slNo (meter-scan pagination).
   */
  validateSlNoSequence(rows: CollectionReportRow[]): void {
    if (rows.length === 0) return;
    const first = Number(rows[0]?.slNo);
    expect(first).toBeGreaterThan(0);
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(first + index);
    });
  }

  /**
   * Duplicate id / slNo / meterLookupId / meterSerialNumber on one page is a fail.
   * Same circle/division across rows is valid.
   */
  validateNoDuplicateMeters(rows: CollectionReportRow[]): void {
    const ids = rows.map((r) => String(r.id ?? ""));
    const slNos = rows.map((r) => Number(r.slNo));
    const lookupIds = rows.map((r) => Number(r.meterLookupId));
    const serials = rows.map((r) =>
      String(r.meterSerialNumber ?? "")
        .trim()
        .toLowerCase(),
    );

    expect(new Set(ids).size, "duplicate row id on page").toBe(ids.length);
    expect(new Set(slNos).size, "duplicate slNo on page").toBe(slNos.length);
    expect(new Set(lookupIds).size, "duplicate meterLookupId on page").toBe(lookupIds.length);
    expect(new Set(serials).size, "duplicate meterSerialNumber on page").toBe(serials.length);
  }

  validateNoOverlapAcrossPages(pageA: CollectionReportRow[], pageB: CollectionReportRow[]): void {
    const idsA = new Set(pageA.map((r) => Number(r.meterLookupId)));
    for (const row of pageB) {
      const id = Number(row.meterLookupId);
      expect(idsA.has(id), `meterLookupId ${id} appears on both pages`).toBeFalsy();
    }
  }

  validateNonEmptyWhenExpected(mapped: MappedCollectionReport, nonEmptyExpected?: boolean): void {
    if (nonEmptyExpected) {
      expect(mapped.rows.length).toBeGreaterThan(0);
    }
  }

  validateLiveOk(
    mapped: MappedCollectionReport,
    reportType: CollectionReportType,
    page = collectionReportDefaultPage,
    limit = collectionReportDefaultLimit,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped, reportType);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validateScanMeta(mapped);
    this.validateRowsLimit(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateSlNoSequence(mapped.rows);
      this.validateNoDuplicateMeters(mapped.rows);
    }
  }

  validateContractMismatchSample(mapped: MappedCollectionReport): void {
    this.validateLiveOk(mapped, "current-mismatch", 1, 100);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.metersFetched).toBe(100);
    expect(mapped.nextMeterLookupId).toBe(1203);
    expect(mapped.rows[0]?.meterSerialNumber).toBe("97792540");
    expect(mapped.rows[1]?.meterSerialNumber).toBe("85080153");
  }

  validateContractEmptyRows(mapped: MappedCollectionReport): void {
    this.validateLiveOk(mapped, "current-imbalance", 1, 10);
    expect(mapped.rows.length).toBe(0);
    expect(mapped.metersFetched).toBe(10);
  }

  validateScenario(
    mapped: MappedCollectionReport,
    scenario: CollectionReportScenario,
    reportType: CollectionReportType,
    page = collectionReportDefaultPage,
    limit = collectionReportDefaultLimit,
    options: { nonEmptyExpected?: boolean } = {},
  ): void {
    switch (scenario) {
      case "contract_current_mismatch_sample":
        this.validateContractMismatchSample(mapped);
        break;
      case "contract_empty_rows":
        this.validateContractEmptyRows(mapped);
        break;
      case "dev_current_mismatch_limit_one":
        this.validateLiveOk(mapped, reportType, page, limit);
        expect(mapped.rows.length).toBeLessThanOrEqual(1);
        break;
      case "dev_current_mismatch_page2":
        this.validateLiveOk(mapped, reportType, page, limit);
        break;
      default:
        this.validateLiveOk(mapped, reportType, page, limit);
        this.validateNonEmptyWhenExpected(mapped, options.nonEmptyExpected);
        break;
    }
  }
}
