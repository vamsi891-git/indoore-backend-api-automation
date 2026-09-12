import { expect } from "@playwright/test";
import {
  ConsumptionCompareResponse,
  ConsumptionCompareRow,
} from "../Mapper/consumptioncompare.mapper";
import {
  COMPARE_LAST_MONTH_GRID_COLUMN_KEYS,
  type ConsumptionCompareType,
} from "../Data/consumptioncompare.data";
import {
  formatCommercialMetricKey,
  getCommercialPaginatedView,
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
  validateUniqueMeterIdentityAllowingDistinctMetric,
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
  return type === "Abnormal High";
}

function isAbnormalLow(type: ConsumptionCompareType): boolean {
  return type === "Abnormal Low";
}

export class ConsumptionCompareValidator {
  validateResponse(response: ConsumptionCompareResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
    const data = response.data!;
    expect(Array.isArray(data.rows)).toBeTruthy();
    expect(data.rows.length).toBeGreaterThan(0);
    if (!isCommercialGridData(data)) {
      expect(data.reportName).toBeTruthy();
      expect(data.description).toBeTruthy();
    }
  }

  validateLastMonthGridColumns(response: ConsumptionCompareResponse): void {
    const columns = response.data?.columns;
    if (!columns?.length) {
      return;
    }
    const keys = columns.map((column) => column.key);
    for (const expected of COMPARE_LAST_MONTH_GRID_COLUMN_KEYS) {
      expect(keys, `missing compare column ${expected}`).toContain(expected);
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
    expect(response.data).toBeDefined();
    const data = response.data!;
    if (isCommercialGridData(data)) {
      return;
    }
    if (isPrevMonthCompare(type)) {
      expect(data.reportName).toMatch(/Consumption Compare Last Month/i);
      expect(data.description).toMatch(/50%|previous month/i);
    } else if (isSameMonthLastYearCompare(type)) {
      expect(data.reportName).toMatch(/Same Month Last Year/i);
    } else if (isAbnormalHigh(type)) {
      expect(data.reportName).toMatch(/abnormal.*high|high/i);
    } else if (isAbnormalLow(type)) {
      expect(data.reportName).toMatch(/abnormal.*low|low/i);
    }
  }

  validateMandatoryFields(rows: ConsumptionCompareRow[]): void {
    for (const row of rows) {
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.msn).toBeTruthy();
      expect(row.ivrsNumber).toBeTruthy();
      expect(Number.isFinite(row.prevKwh)).toBeTruthy();
      expect(Number.isFinite(row.currKwh)).toBeTruthy();
      expect(row.prevKwh).toBeGreaterThanOrEqual(0);
      expect(row.currKwh).toBeGreaterThanOrEqual(0);
    }
  }

  /**
   * Last Month / Same Month Last Year: prev.kwh > 0 AND curr.kwh < prev.kwh * 0.5.
   * Live Last Month allows currKwh = 0.
   */
  validateMonthOverMonthDrop(rows: ConsumptionCompareRow[]): void {
    for (const row of rows) {
      expect(
        row.prevKwh,
        `MSN ${row.msn}: prevKwh (Old kWh) must be > 0`,
      ).toBeGreaterThan(0);
      expect(
        row.currKwh,
        `MSN ${row.msn}: currKwh ${row.currKwh} must be < 50% of prevKwh ${row.prevKwh}`,
      ).toBeLessThan(row.prevKwh * 0.5);
    }
  }

  validateAbnormalHigh(rows: ConsumptionCompareRow[]): void {
    for (const row of rows) {
      expect(row.prevKwh, `MSN ${row.msn}: baseline avg must be > 0`).toBeGreaterThan(
        0,
      );
      expect(
        row.currKwh,
        `MSN ${row.msn}: currKwh must be >= 3x baseline ${row.prevKwh}`,
      ).toBeGreaterThanOrEqual(row.prevKwh * 3);
    }
  }

  validateAbnormalLow(rows: ConsumptionCompareRow[]): void {
    for (const row of rows) {
      expect(row.prevKwh, `MSN ${row.msn}: baseline avg must be > 0`).toBeGreaterThan(
        0,
      );
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

  compareMetricKey(row: ConsumptionCompareRow): string {
    return `${formatCommercialMetricKey(row.currKwh)}|old=${formatCommercialMetricKey(row.prevKwh)}`;
  }

  validateNoDuplicateRecords(rows: ConsumptionCompareRow[]): void {
    validateNoDuplicateMeterRows(rows, "Consumption Compare");
  }

  /**
   * This report has no duplicate records. Still checks lookupId + DTR uniqueness
   * and same-MSN same-New/Old-kWh same-DTR on the page.
   */
  validateUniqueIdentityFields(rows: ConsumptionCompareRow[]): void {
    validateUniqueMeterIdentityAllowingDistinctMetric(
      rows,
      "Consumption Compare",
      (row) => this.compareMetricKey(row),
    );
  }

  validateDuplicateContract(rows: ConsumptionCompareRow[]): void {
    this.validateNoDuplicateRecords(rows);
    this.validateUniqueIdentityFields(rows);
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
