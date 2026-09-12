import { expect } from "@playwright/test";
import {
  ConsumptionPatternResponse,
  ConsumptionPatternRow,
} from "../Mapper/consumptionpattern.mapper";
import {
  PATTERN_GRID_COLUMN_KEYS,
  type ConsumptionPatternKind,
} from "../Data/consumptionpattern.data";
import {
  formatCommercialMetricKey,
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
  validateUniqueMeterIdentityAllowingDistinctMetric,
} from "./commercial-analysis.shared";

export class ConsumptionPatternValidator {
  validateResponse(response: ConsumptionPatternResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
    const data = response.data!;
    expect(Array.isArray(data.rows)).toBeTruthy();
    expect(data.rows.length).toBeGreaterThan(0);
  }

  validateGridColumns(response: ConsumptionPatternResponse): void {
    const columns = response.data?.columns;
    if (!columns?.length) {
      return;
    }
    const keys = columns.map((column) => column.key);
    for (const expected of PATTERN_GRID_COLUMN_KEYS) {
      expect(keys, `missing pattern column ${expected}`).toContain(expected);
    }
  }

  validateQueryParams(
    response: ConsumptionPatternResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    expect(response.data).toBeDefined();
    validateCommercialQueryParams(response.data!, query);
  }

  validateReportForPattern(
    response: ConsumptionPatternResponse,
    kind: ConsumptionPatternKind,
  ): void {
    expect(response.data).toBeDefined();
    const data = response.data!;
    if (isCommercialGridData(data)) {
      return;
    }
    if (kind === "zero") {
      expect(data.reportName).toMatch(/zero consumption/i);
    } else if (kind === "low") {
      expect(data.reportName).toMatch(/low consumption|100 unit/i);
    }
  }

  validateMandatoryFields(rows: ConsumptionPatternRow[]): void {
    for (const row of rows) {
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.msn).toBeTruthy();
      expect(row.ivrsNumber).toBeTruthy();
      expect(Number.isFinite(row.kWh)).toBeTruthy();
      expect(row.kWh).toBeGreaterThanOrEqual(0);
    }
  }

  validateZeroConsumption(rows: ConsumptionPatternRow[]): void {
    for (const row of rows) {
      expect(row.kWh, `MSN ${row.msn} has non-zero consumption`).toBe(0);
    }
  }

  validateLowConsumption(
    rows: ConsumptionPatternRow[],
    threshold: number,
  ): void {
    for (const row of rows) {
      expect(
        row.kWh,
        `MSN ${row.msn}: kWh ${row.kWh} must be below ${threshold}`,
      ).toBeLessThan(threshold);
    }
  }

  validatePatternRows(
    rows: ConsumptionPatternRow[],
    kind: ConsumptionPatternKind,
    threshold: number,
  ): void {
    if (kind === "zero") {
      this.validateZeroConsumption(rows);
    } else if (kind === "low") {
      this.validateLowConsumption(rows, threshold);
    }
  }

  validateNoDuplicateConsumer(rows: ConsumptionPatternRow[]): void {
    validateNoDuplicateMeterRows(rows, "Consumption Pattern");
  }

  patternMetricKey(row: ConsumptionPatternRow): string {
    return formatCommercialMetricKey(row.kWh);
  }

  /**
   * This report has no duplicate records. Still checks lookupId + DTR uniqueness
   * and same-MSN same-kWh same-DTR on the page.
   */
  validateUniqueIdentityFields(rows: ConsumptionPatternRow[]): void {
    validateUniqueMeterIdentityAllowingDistinctMetric(
      rows,
      "Consumption Pattern",
      (row) => this.patternMetricKey(row),
    );
  }

  validateDuplicateContract(rows: ConsumptionPatternRow[]): void {
    this.validateNoDuplicateConsumer(rows);
    this.validateUniqueIdentityFields(rows);
  }

  validatePagination(
    response: ConsumptionPatternResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialPagination(response.data, query);
  }

  validateTotalCount(
    response: ConsumptionPatternResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialTotalCount(response.data, query);
  }

  /**
   * Kept for mutation proofs. Live 100-unit 3m strips connectionCategory.
   */
  validateDomesticNonDomesticTotals(options: {
    allTotal: number;
    domesticTotal: number;
    nonDomesticTotal: number;
  }): void {
    const { allTotal, domesticTotal, nonDomesticTotal } = options;
    expect(domesticTotal).toBeGreaterThanOrEqual(0);
    expect(nonDomesticTotal).toBeGreaterThanOrEqual(0);
    expect(allTotal).toBeGreaterThanOrEqual(0);
    expect(
      domesticTotal + nonDomesticTotal,
      "domestic + non-domestic must not exceed unfiltered total",
    ).toBeLessThanOrEqual(allTotal);
  }
}
