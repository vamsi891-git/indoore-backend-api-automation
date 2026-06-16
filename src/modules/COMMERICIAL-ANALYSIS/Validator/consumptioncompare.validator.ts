import { expect } from "@playwright/test";
import {
  ConsumptionCompareResponse,
  ConsumptionCompareRow,
} from "../Mapper/consumptioncompare.mapper";
import type { ConsumptionCompareType } from "../Data/consumptioncompare.data";
import {
  getCommercialPaginatedView,
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
} from "./commercial-analysis.shared";

export interface ConsumptionCompareQueryShape {
  month: number;
  year: number;
  type: ConsumptionCompareType;
  page: number;
  pageSize: number;
}

function isPrevMonthCompare(type: ConsumptionCompareType): boolean {
  return type === "Consumption Compare Last Month";
}

function isSameMonthLastYearCompare(type: ConsumptionCompareType): boolean {
  return type === "Consumption Compare Same Month Last Year";
}

function isMonthOverMonthCompare(type: ConsumptionCompareType): boolean {
  return isPrevMonthCompare(type) || isSameMonthLastYearCompare(type);
}

function isAbnormalHigh(type: ConsumptionCompareType): boolean {
  return type === "Abnormal High Consumption";
}

function isAbnormalLow(type: ConsumptionCompareType): boolean {
  return type === "Abnormal Low Consumption";
}

export class ConsumptionCompareValidator {
  validateResponse(response: ConsumptionCompareResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.rows)).toBeTruthy();
    if (!isCommercialGridData(response.data)) {
      expect(response.data.reportName).toBeTruthy();
      expect(response.data.description).toBeTruthy();
    }
  }

  validateHasData(
    response: ConsumptionCompareResponse,
    query: ConsumptionCompareQueryShape,
  ): void {
    const view = getCommercialPaginatedView(response.data, query);
    expect(view.totalCount).toBeGreaterThan(0);
    expect(view.rows.length).toBeGreaterThan(0);
  }

  validateNoDataScenario(
    response: ConsumptionCompareResponse,
    query: ConsumptionCompareQueryShape,
  ): void {
    const view = getCommercialPaginatedView(response.data, query);
    if (view.totalCount === 0) {
      expect(view.rows.length).toBe(0);
      expect(view.totalPages).toBe(0);
    }
  }

  validateQueryParams(
    response: ConsumptionCompareResponse,
    query: ConsumptionCompareQueryShape,
  ): void {
    validateCommercialQueryParams(response.data, query);
  }

  validateReportForType(
    response: ConsumptionCompareResponse,
    type: ConsumptionCompareType,
  ): void {
    if (isCommercialGridData(response.data)) {
      return;
    }
    if (isPrevMonthCompare(type)) {
      expect(response.data.reportName).toMatch(/Consumption Compare Last Month/i);
      expect(response.data.description).toMatch(/50%|previous month/i);
    } else if (isSameMonthLastYearCompare(type)) {
      expect(response.data.reportName).toMatch(/Same Month Last Year/i);
    } else if (isAbnormalHigh(type)) {
      expect(response.data.reportName).toMatch(/abnormal.*high|high/i);
    } else if (isAbnormalLow(type)) {
      expect(response.data.reportName).toMatch(/abnormal.*low|low/i);
    }
  }

  validateMandatoryFields(rows: ConsumptionCompareRow[]): void {
    for (const row of rows) {
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.msn).toBeTruthy();
      expect(Number.isFinite(row.prevKwh)).toBeTruthy();
      expect(Number.isFinite(row.currKwh)).toBeTruthy();
      expect(row.prevKwh).toBeGreaterThanOrEqual(0);
      expect(row.currKwh).toBeGreaterThanOrEqual(0);
    }
  }

  /**
   * Backend prev_month / same_month_last_year:
   * prev.kwh > 0 AND curr.kwh < (prev.kwh * 0.5)
   */
  validateMonthOverMonthDrop(rows: ConsumptionCompareRow[]): void {
    for (const row of rows) {
      expect(
        row.prevKwh,
        `MSN ${row.msn}: prevKwh must be > 0`,
      ).toBeGreaterThan(0);
      expect(
        row.currKwh,
        `MSN ${row.msn}: currKwh ${row.currKwh} must be < 50% of prevKwh ${row.prevKwh}`,
      ).toBeLessThan(row.prevKwh * 0.5);
    }
  }

  /**
   * Backend abnormal high: curr.kwh >= (avg_kwh * 3); prevKwh holds avg in response
   */
  validateAbnormalHigh(rows: ConsumptionCompareRow[]): void {
    for (const row of rows) {
      expect(row.prevKwh, `MSN ${row.msn}: baseline avg must be > 0`).toBeGreaterThan(0);
      expect(
        row.currKwh,
        `MSN ${row.msn}: currKwh must be >= 3x baseline ${row.prevKwh}`,
      ).toBeGreaterThanOrEqual(row.prevKwh * 3);
    }
  }

  /**
   * Backend abnormal low: curr.kwh <= (avg_kwh / 3)
   */
  validateAbnormalLow(rows: ConsumptionCompareRow[]): void {
    for (const row of rows) {
      expect(row.prevKwh, `MSN ${row.msn}: baseline avg must be > 0`).toBeGreaterThan(0);
      expect(
        row.currKwh,
        `MSN ${row.msn}: currKwh must be <= baseline/3 (${row.prevKwh / 3})`,
      ).toBeLessThanOrEqual(row.prevKwh / 3);
    }
  }

  validateBusinessRules(
    rows: ConsumptionCompareRow[],
    type: ConsumptionCompareType,
  ): void {
    if (isMonthOverMonthCompare(type)) {
      this.validateMonthOverMonthDrop(rows);
    } else if (isAbnormalHigh(type)) {
      this.validateAbnormalHigh(rows);
    } else if (isAbnormalLow(type)) {
      this.validateAbnormalLow(rows);
    }
  }

  /** Backend ORDER BY curr_kwh ASC for month-over-month and abnormal low */
  validateCurrKwhAscendingOrder(rows: ConsumptionCompareRow[]): void {
    for (let i = 1; i < rows.length; i++) {
      expect(
        rows[i - 1].currKwh,
        `currKwh not ascending at index ${i - 1}`,
      ).toBeLessThanOrEqual(rows[i].currKwh);
    }
  }

  /** Backend ORDER BY curr_kwh DESC for abnormal high */
  validateCurrKwhDescendingOrder(rows: ConsumptionCompareRow[]): void {
    for (let i = 1; i < rows.length; i++) {
      expect(
        rows[i - 1].currKwh,
        `currKwh not descending at index ${i - 1}`,
      ).toBeGreaterThanOrEqual(rows[i].currKwh);
    }
  }

  validateSortOrder(rows: ConsumptionCompareRow[], type: ConsumptionCompareType): void {
    if (isAbnormalHigh(type)) {
      this.validateCurrKwhDescendingOrder(rows);
    } else {
      this.validateCurrKwhAscendingOrder(rows);
    }
  }

  validateNoDuplicateRecords(rows: ConsumptionCompareRow[]): void {
    validateNoDuplicateMeterRows(rows, "Consumption Compare");
  }

  validatePagination(
    response: ConsumptionCompareResponse,
    query: ConsumptionCompareQueryShape,
  ): void {
    validateCommercialPagination(response.data, query);
  }

  validateTotalCount(
    response: ConsumptionCompareResponse,
    query: ConsumptionCompareQueryShape,
  ): void {
    validateCommercialTotalCount(response.data, query);
  }
}
