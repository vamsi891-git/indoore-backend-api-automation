import { expect } from "@playwright/test";
import {
  ConsumptionPatternResponse,
  ConsumptionPatternRow,
} from "../Mapper/consumptionpattern.mapper";
import {
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
} from "./commercial-analysis.shared";

export type ConsumptionPatternType = "zero" | "low" | "avg_less_than_initial";

export class ConsumptionPatternValidator {
  validateResponse(response: ConsumptionPatternResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data.rows.length).toBeGreaterThan(0);
  }

  validateQueryParams(
    response: ConsumptionPatternResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialQueryParams(response.data, query);
  }

  validateReportForPattern(
    response: ConsumptionPatternResponse,
    pattern: ConsumptionPatternType,
  ): void {
    if (isCommercialGridData(response.data)) {
      return;
    }
    if (pattern === "zero") {
      expect(response.data.reportName).toMatch(/zero consumption/i);
      expect(response.data.description).toMatch(/zero\s+kwh/i);
    } else if (pattern === "low") {
      expect(response.data.reportName).toMatch(/low consumption/i);
    }
  }

  validateMandatoryFields(rows: ConsumptionPatternRow[]): void {
    for (const row of rows) {
      expect(row.msn).toBeTruthy();
      expect(Number.isFinite(row.kWh)).toBeTruthy();
      expect(row.kWh).toBeGreaterThanOrEqual(0);
    }
  }

  /** Backend zero pattern: COALESCE(kwh,0)=0 for all billing rows in window */
  validateZeroConsumption(rows: ConsumptionPatternRow[]): void {
    for (const row of rows) {
      expect(row.kWh, `Consumer ${row.msn} has non-zero consumption`).toBe(0);
    }
  }

  /** Backend low pattern: SUM(kwh) < threshold over the window */
  validateLowConsumption(
    rows: ConsumptionPatternRow[],
    threshold: number,
  ): void {
    for (const row of rows) {
      expect(
        row.kWh,
        `Consumer ${row.msn}: kWh ${row.kWh} must be below ${threshold}`,
      ).toBeLessThan(threshold);
    }
  }

  validatePatternRows(
    rows: ConsumptionPatternRow[],
    pattern: ConsumptionPatternType,
    threshold: number,
  ): void {
    if (pattern === "zero") {
      this.validateZeroConsumption(rows);
    } else if (pattern === "low") {
      this.validateLowConsumption(rows, threshold);
    }
  }

  validateNoDuplicateConsumer(rows: ConsumptionPatternRow[]): void {
    validateNoDuplicateMeterRows(rows, "Consumption Pattern");
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
}
