import { expect } from "@playwright/test";
import {
  PowerFactorResponse,
  PowerFactorRow,
} from "../Mapper/powerfactor.mapper";
import { PF_GRID_COLUMN_KEYS } from "../Data/powerfactor.data";
import {
  formatCommercialMetricKey,
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
  validateUniqueMeterIdentityAllowingDistinctMetric,
} from "./commercial-analysis.shared";

export class PowerFactorValidator {
  validateResponse(response: PowerFactorResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
    expect(response.data.rows.length).toBeGreaterThan(0);
    if (!isCommercialGridData(response.data)) {
      expect(response.data.reportName).toContain("Power Factor");
    }
  }

  validateGridColumns(response: PowerFactorResponse): void {
    const columns = response.data.columns;
    if (!columns?.length) {
      return;
    }
    const keys = columns.map((column) => column.key);
    for (const expected of PF_GRID_COLUMN_KEYS) {
      expect(keys, `missing PF column ${expected}`).toContain(expected);
    }
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

  validateUniqueIdentityFields(rows: PowerFactorRow[]): void {
    validateUniqueMeterIdentityAllowingDistinctMetric(
      rows,
      "Power Factor",
      (row) => formatCommercialMetricKey(row.pf),
    );
  }

  validateMandatoryFields(rows: PowerFactorRow[]): void {
    for (const row of rows) {
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.msn).toBeTruthy();
      expect(row.ivrsNumber).toBeTruthy();
      expect(Number.isFinite(row.pf)).toBeTruthy();
    }
  }

  /**
   * Live grid: PF is the meter value, PF<.8 is the threshold echo.
   * Non-domestic pages include PF=0; only negatives and PF >= threshold fail.
   */
  validatePfBelowThreshold(rows: PowerFactorRow[], threshold: number): void {
    for (const row of rows) {
      expect(row.pf, `MSN ${row.msn}: PF must be >= 0`).toBeGreaterThanOrEqual(0);
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

  validatePagination(
    response: PowerFactorResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialPagination(response.data, query);
  }

  validateTotalCount(
    response: PowerFactorResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialTotalCount(response.data, query);
  }

  /**
   * Domestic + non-domestic PF totals must partition within the unfiltered total
   * (uncategorized meters may make the sum slightly less than all).
   */
  validateDomesticNonDomesticTotals(options: {
    allTotal: number;
    domesticTotal: number;
    nonDomesticTotal: number;
  }): void {
    const { allTotal, domesticTotal, nonDomesticTotal } = options;
    expect(domesticTotal, "domestic PF total").toBeGreaterThan(0);
    expect(nonDomesticTotal, "non-domestic PF total").toBeGreaterThan(0);
    expect(allTotal, "unfiltered PF total").toBeGreaterThanOrEqual(
      domesticTotal + nonDomesticTotal,
    );
    expect(
      domesticTotal + nonDomesticTotal,
      "domestic + non-domestic must not exceed unfiltered total",
    ).toBeLessThanOrEqual(allTotal);
  }
}
