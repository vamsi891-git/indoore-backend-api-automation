import { expect } from "@playwright/test";
import {
  PowerFactorResponse,
  PowerFactorRow,
} from "../Mapper/powerfactor.mapper";
import {
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
} from "./commercial-analysis.shared";

export class PowerFactorValidator {
  validateResponse(response: PowerFactorResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data.reportName).toContain("Power Factor");
    expect(response.data.rows.length).toBeGreaterThan(0);
  }

  validateQueryParams(
    response: PowerFactorResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialQueryParams(response.data, query);
  }

  validateNoDuplicatePfRecords(rows: PowerFactorRow[]): void {
    validateNoDuplicateMeterRows(rows, "Power Factor");
  }

  validateMandatoryFields(rows: PowerFactorRow[]): void {
    for (const row of rows) {
      expect(row.msn).toBeTruthy();
      expect(Number.isFinite(row.pf)).toBeTruthy();
    }
  }

  /** Backend: AVG(pf) where pf IS NOT NULL AND pf > 0 AND pf < threshold */
  validatePfBelowThreshold(rows: PowerFactorRow[], threshold: number): void {
    for (const row of rows) {
      expect(
        row.pf,
        `MSN ${row.msn}: PF must be > 0 (billing filter)`,
      ).toBeGreaterThan(0);
      expect(
        row.pf,
        `MSN ${row.msn}: PF ${row.pf} must be below threshold ${threshold}`,
      ).toBeLessThan(threshold);
    }
  }

  /** API column "PF<.8" echoes the query threshold used for the report */
  validateReportThresholdColumn(
    rows: PowerFactorRow[],
    threshold: number,
  ): void {
    for (const row of rows) {
      if (row.reportThreshold !== undefined) {
        expect(row.reportThreshold).toBe(threshold);
      }
    }
  }

  validatePagination(response: PowerFactorResponse): void {
    validateCommercialPagination(response.data);
  }

  validateTotalCount(response: PowerFactorResponse): void {
    validateCommercialTotalCount(response.data);
  }
}
