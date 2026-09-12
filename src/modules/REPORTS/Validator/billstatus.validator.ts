import { expect } from "@playwright/test";
import {
  billStatusDefaultLimit,
  billStatusDefaultPage,
  billStatusExpectedColumns,
} from "../Data/billstatus.data";
import type {
  BillStatusErrorBody,
  BillStatusResponse,
  BillStatusRow,
  BillStatusScenario,
  MappedBillStatus,
} from "../Mapper/billstatus.mapper";
import { billStatusColumnKeys } from "../Mapper/billstatus.mapper";

export class BillStatusValidator {
  validateResponseEnvelope(response: BillStatusResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: BillStatusErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedBillStatus): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedBillStatus): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
    expect(mapped.summary).toBeDefined();
  }

  validateColumns(mapped: MappedBillStatus): void {
    expect(mapped.columns.length).toBe(billStatusExpectedColumns.length);
    const keys = mapped.columns.map((c) => c.key);
    for (const col of billStatusExpectedColumns) {
      expect(keys).toContain(col.key);
      expect(billStatusColumnKeys).toContain(col.key);
      expect(mapped.columns.find((c) => c.key === col.key)?.header).toBe(
        col.header,
      );
    }
  }

  validatePaginationEcho(
    mapped: MappedBillStatus,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedBillStatus): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  /**
   * includeTotal=false → total/totalPages may be null.
   * Empty rows with total 0 is fine when summary still has counts.
   */
  validatePaginationMath(
    mapped: MappedBillStatus,
    includeTotal = true,
  ): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } =
      mapped.pagination;
    const { rows } = mapped;

    if (!includeTotal) {
      if (total != null && totalPages != null) {
        if (total === 0) {
          expect(rows.length).toBe(0);
          expect(totalPages).toBe(0);
        } else {
          expect(totalPages).toBe(Math.ceil(total / limit));
        }
      } else {
        expect(total).toBeNull();
        expect(totalPages).toBeNull();
        if (totalIsExact != null) expect(totalIsExact).toBe(false);
      }
      if (hasMore != null) expect(typeof hasMore).toBe("boolean");
      return;
    }

    expect(total).not.toBeNull();
    expect(totalPages).not.toBeNull();
    const t = total as number;
    const tp = totalPages as number;
    if (t === 0) {
      expect(rows.length).toBe(0);
      expect(tp).toBe(0);
      if (hasMore != null) expect(hasMore).toBe(false);
      return;
    }
    expect(tp).toBe(Math.ceil(t / limit));
    expect(t).toBeGreaterThanOrEqual(rows.length);
    if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
    if (hasMore != null) expect(hasMore).toBe(page < tp);
  }

  /**
   * Summary is the primary payload for this report.
   * Empty rows + non-zero summary is valid (not “no data”).
   */
  validateSummary(mapped: MappedBillStatus): void {
    expect(mapped.summary).not.toBeNull();
    const summary = mapped.summary!;
    expect(summary.totalConsumers).toBeGreaterThanOrEqual(0);
    expect(summary.billGenerated).toBeGreaterThanOrEqual(0);
    expect(summary.billNotGenerated).toBeGreaterThanOrEqual(0);
    expect(summary.billGenerated + summary.billNotGenerated).toBe(
      summary.totalConsumers,
    );
  }

  validateRowsStructure(rows: BillStatusRow[]): void {
    for (const row of rows) {
      if (row.slNo !== undefined) expect(typeof row.slNo).toBe("number");
      if (row.totalConsumer != null) {
        expect(Number.isFinite(Number(row.totalConsumer))).toBeTruthy();
      }
      if (row.billGenerated != null) {
        expect(Number.isFinite(Number(row.billGenerated))).toBeTruthy();
      }
      if (row.billNotGenerated != null) {
        expect(Number.isFinite(Number(row.billNotGenerated))).toBeTruthy();
      }
      if (
        row.totalConsumer != null &&
        row.billGenerated != null &&
        row.billNotGenerated != null
      ) {
        expect(Number(row.billGenerated) + Number(row.billNotGenerated)).toBe(
          Number(row.totalConsumer),
        );
      }
    }
  }

  validateUniqueRows(rows: BillStatusRow[]): void {
    const slNos = rows
      .map((row) => row.slNo)
      .filter((slNo): slNo is number => slNo != null);
    expect(new Set(slNos).size).toBe(slNos.length);
    const ids = rows
      .map((row) => row.id)
      .filter((id): id is string => id != null && id !== "");
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateSlNoSequence(
    rows: BillStatusRow[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      if (row.slNo !== undefined) {
        expect(row.slNo).toBe(base + index + 1);
      }
    });
  }

  validateLiveOk(
    mapped: MappedBillStatus,
    page = billStatusDefaultPage,
    limit = billStatusDefaultLimit,
    includeTotal = true,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, includeTotal);
    this.validateSummary(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueRows(mapped.rows);
    }
  }

  validateLiveOct2025Contract(mapped: MappedBillStatus): void {
    this.validateLiveOk(mapped, 1, 10, true);
    expect(mapped.rows.length).toBe(0);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.summary?.totalConsumers).toBe(141059);
    expect(mapped.summary?.billGenerated).toBe(120010);
    expect(mapped.summary?.billNotGenerated).toBe(21049);
  }

  validateEmptySummaryZeroContract(mapped: MappedBillStatus): void {
    this.validateLiveOk(mapped, 1, 10, true);
    expect(mapped.rows.length).toBe(0);
    expect(mapped.summary?.totalConsumers).toBe(0);
    expect(mapped.summary?.billGenerated).toBe(0);
    expect(mapped.summary?.billNotGenerated).toBe(0);
  }

  validatePageBeyondLive(mapped: MappedBillStatus): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, true);
    this.validateSummary(mapped);
    expect(mapped.rows.length).toBe(0);
  }

  validateScenario(
    mapped: MappedBillStatus,
    scenario: BillStatusScenario,
    page = billStatusDefaultPage,
    limit = billStatusDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_oct_2025":
        this.validateLiveOct2025Contract(mapped);
        break;
      case "contract_empty_summary_zero":
        this.validateEmptySummaryZeroContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped);
        break;
      case "dev_live_without_total":
        this.validateLiveOk(mapped, page, limit, false);
        break;
      case "dev_live_include_total":
      case "dev_limit_one":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, page, limit, true);
        break;
      default:
        break;
    }
  }
}
