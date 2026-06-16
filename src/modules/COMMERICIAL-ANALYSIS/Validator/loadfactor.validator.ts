import { expect } from "@playwright/test";

import { LFAnalysisResponse, LFAnalysisRow } from "../Mapper/loadfactor.mapper";
import {
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
} from "./commercial-analysis.shared";

export type LfOperator = "lt" | "gt";

export class LFAnalysisValidator {
  validateResponse(response: LFAnalysisResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data.rows.length).toBeGreaterThan(0);
    if (!isCommercialGridData(response.data)) {
      expect(response.data.reportName).toMatch(/LF/i);
    }
  }

  validateQueryParams(
    response: LFAnalysisResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialQueryParams(response.data, query);
  }

  validateMandatoryFields(rows: LFAnalysisRow[]): void {
    for (const row of rows) {
      expect(row.msn).toBeTruthy();
      expect(Number.isFinite(row.lf)).toBeTruthy();
      expect(row.lf).toBeGreaterThanOrEqual(0);
    }
  }

  /**
   * Backend: (kwh*100)/(md_kw*billing_minutes/60) compared with threshold
   * operator 'lt' => lf < threshold, 'gt' => lf > threshold
   */
  validateLfAgainstThreshold(
    rows: LFAnalysisRow[],
    threshold: number,
    operator: LfOperator,
  ): void {
    for (const row of rows) {
      if (operator === "lt") {
        expect(
          row.lf,
          `MSN ${row.msn}: LF ${row.lf} must be < ${threshold}`,
        ).toBeLessThan(threshold);
      } else {
        expect(
          row.lf,
          `MSN ${row.msn}: LF ${row.lf} must be > ${threshold}`,
        ).toBeGreaterThan(threshold);
      }
    }
  }

  validateNoDuplicateLFRecords(rows: LFAnalysisRow[]): void {
    validateNoDuplicateMeterRows(rows, "LF Analysis");
  }

  validatePagination(response: LFAnalysisResponse, query: { month: number; year: number; page: number; pageSize: number }): void {
    validateCommercialPagination(response.data, query);
  }

  validateTotalCount(response: LFAnalysisResponse, query: { month: number; year: number; page: number; pageSize: number }): void {
    validateCommercialTotalCount(response.data, query);
  }
}
