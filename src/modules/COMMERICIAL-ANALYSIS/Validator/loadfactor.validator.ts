import { expect } from "@playwright/test";
import { LFAnalysisResponse, LFAnalysisRow } from "../Mapper/loadfactor.mapper";
import { lfGridColumnKeys, type LfAnalysisType } from "../Data/loadfactor.api";
import {
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
  validateUniqueMeterIdentityAllowingDistinctMetric,
  formatCommercialMetricKey,
} from "./commercial-analysis.shared";

export type LfOperator = "lt" | "gt";

export class LFAnalysisValidator {
  validateResponse(response: LFAnalysisResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
    expect(response.data.rows.length).toBeGreaterThan(0);
    if (!isCommercialGridData(response.data)) {
      expect(response.data.reportName).toMatch(/LF/i);
    }
  }

  validateGridColumns(
    response: LFAnalysisResponse,
    type: LfAnalysisType,
  ): void {
    const columns = response.data.columns;
    if (!columns?.length) {
      return;
    }
    const keys = columns.map((column) => column.key);
    for (const expected of lfGridColumnKeys(type)) {
      expect(keys, `missing LF column ${expected}`).toContain(expected);
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
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.msn).toBeTruthy();
      expect(row.ivrsNumber).toBeTruthy();
      expect(Number.isFinite(row.lf)).toBeTruthy();
      expect(row.lf).toBeGreaterThanOrEqual(0);
    }
  }

  /**
   * Live grid: LF is a display string such as "0.01" or "100.17".
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

  /** Hard duplicate contract: unique lookup/id, same MSN only when LF differs. */
  validateDuplicateContract(rows: LFAnalysisRow[]): void {
    this.validateNoDuplicateLFRecords(rows);
    this.validateUniqueIdentityFields(rows);
  }

  lfMetricKey(row: LFAnalysisRow): string {
    const lf = formatCommercialMetricKey(row.lf);
    if (row.sanctionedLoadKw !== undefined) {
      return `${lf}|sl=${formatCommercialMetricKey(row.sanctionedLoadKw)}`;
    }
    return lf;
  }

  /**
   * Same MSN on two DTRs is allowed. Same MSN + DTR + LF is a duplicate.
   */
  validateUniqueIdentityFields(rows: LFAnalysisRow[]): void {
    validateUniqueMeterIdentityAllowingDistinctMetric(
      rows,
      "LF Analysis",
      (row) => this.lfMetricKey(row),
    );
  }

  validatePagination(
    response: LFAnalysisResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialPagination(response.data, query);
  }

  validateTotalCount(
    response: LFAnalysisResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialTotalCount(response.data, query);
  }

  /**
   * Kept for mutation proofs. Live LF detail SQL strips connectionCategory,
   * so domestic/non-domestic pages echo the unfiltered total.
   */
  validateDomesticNonDomesticTotals(options: {
    allTotal: number;
    domesticTotal: number;
    nonDomesticTotal: number;
  }): void {
    const { allTotal, domesticTotal, nonDomesticTotal } = options;
    expect(domesticTotal, "domestic LF total").toBeGreaterThan(0);
    expect(nonDomesticTotal, "non-domestic LF total").toBeGreaterThan(0);
    expect(allTotal, "unfiltered LF total").toBeGreaterThanOrEqual(
      domesticTotal + nonDomesticTotal,
    );
    expect(
      domesticTotal + nonDomesticTotal,
      "domestic + non-domestic must not exceed unfiltered total",
    ).toBeLessThanOrEqual(allTotal);
  }

  /** Echo column LF<5% must match configured threshold (5). Do not use for LF>100%. */
  validateReportThresholdColumn(
    rows: LFAnalysisRow[],
    threshold: number,
  ): void {
    for (const row of rows) {
      if (row.reportThreshold !== undefined) {
        expect(row.reportThreshold).toBe(threshold);
      }
    }
  }

  /** Live LF>100% column is sanctioned load kW (e.g. 4, 5, 7.46), not the 100 cutoff. */
  validateSanctionedLoadColumn(rows: LFAnalysisRow[]): void {
    for (const row of rows) {
      expect(
        row.sanctionedLoadKw,
        `MSN ${row.msn}: LF>100% (sanctioned load) must be present`,
      ).toBeDefined();
      expect(Number.isFinite(row.sanctionedLoadKw)).toBeTruthy();
      expect(row.sanctionedLoadKw as number).toBeGreaterThan(0);
    }
  }
}
