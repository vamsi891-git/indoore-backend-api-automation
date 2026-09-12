import { expect } from "@playwright/test";
import { DayNightResponse, DayNightRow } from "../Mapper/daynight.mapper";
import {
  NIGHT_LTE_THRESHOLD_RATIO,
  dayNightGridColumnKeys,
  type DayNightKind,
  type DayNightType,
} from "../Data/daynight.data";
import {
  formatCommercialMetricKey,
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
  validateUniqueMeterIdentityAllowingDistinctMetric,
} from "./commercial-analysis.shared";

export class DayNightValidator {
  /** Oct 2025: live totals (summary 1130 / 2332). Empty grid is still valid. */
  validateResponse(response: DayNightResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
    const data = response.data!;
    expect(Array.isArray(data.rows)).toBeTruthy();
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns!.length).toBeGreaterThan(0);
  }

  validateGridColumns(response: DayNightResponse, type: DayNightType): void {
    const columns = response.data?.columns;
    expect(columns?.length, "day-night grid must include columns").toBeGreaterThan(
      0,
    );
    const keys = columns!.map((column) => column.key);
    expect(keys, "day-night grid has no subStation").not.toContain("subStation");
    for (const expected of dayNightGridColumnKeys(type)) {
      expect(keys, `missing day-night column ${expected}`).toContain(expected);
    }
  }

  validateQueryParams(
    response: DayNightResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    expect(response.data).toBeDefined();
    validateCommercialQueryParams(response.data!, query);
  }

  validateReportForKind(response: DayNightResponse, kind: DayNightKind): void {
    expect(response.data).toBeDefined();
    const data = response.data!;
    if (isCommercialGridData(data)) {
      return;
    }
    if (kind === "zero") {
      expect(data.reportName).toMatch(/night zero/i);
    } else {
      expect(data.reportName).toMatch(/night consumption|10%/i);
    }
  }

  validateMandatoryFields(rows: DayNightRow[]): void {
    for (const row of rows) {
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.msn).toBeTruthy();
      expect(row.ivrsNumber).toBeTruthy();
    }
  }

  validateNightZeroRules(rows: DayNightRow[]): void {
    for (const row of rows) {
      expect(Number.isFinite(row.count), `MSN ${row.msn}: count must be finite`).toBeTruthy();
      expect(row.count!, `MSN ${row.msn}: count must be >= 0`).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(row.dayKwh), `MSN ${row.msn}: dayKwh must be finite`).toBeTruthy();
      expect(row.dayKwh!, `MSN ${row.msn}: dayKwh must be >= 0`).toBeGreaterThanOrEqual(0);
    }
  }

  validateNightLteRules(rows: DayNightRow[]): void {
    for (const row of rows) {
      expect(Number.isFinite(row.nightKwh), `MSN ${row.msn}: nightKwh must be finite`).toBeTruthy();
      expect(Number.isFinite(row.dayKwh), `MSN ${row.msn}: dayKwh must be finite`).toBeTruthy();
      expect(row.nightKwh!, `MSN ${row.msn}: nightKwh must be >= 0`).toBeGreaterThanOrEqual(0);
      expect(row.dayKwh!, `MSN ${row.msn}: dayKwh must be >= 0`).toBeGreaterThanOrEqual(0);
      const maxNight = row.dayKwh! * NIGHT_LTE_THRESHOLD_RATIO;
      expect(
        row.nightKwh!,
        `MSN ${row.msn}: nightKwh ${row.nightKwh} must be <= ${NIGHT_LTE_THRESHOLD_RATIO * 100}% of dayKwh ${row.dayKwh}`,
      ).toBeLessThanOrEqual(maxNight);
    }
  }

  validateBusinessRules(rows: DayNightRow[], kind: DayNightKind): void {
    if (kind === "zero") {
      this.validateNightZeroRules(rows);
    } else {
      this.validateNightLteRules(rows);
    }
  }

  validateNoDuplicateConsumer(rows: DayNightRow[]): void {
    validateNoDuplicateMeterRows(rows, "Day Night");
  }

  dayNightMetricKey(row: DayNightRow): string {
    if (row.nightKwh != null) {
      return `night=${formatCommercialMetricKey(row.nightKwh)}|day=${formatCommercialMetricKey(row.dayKwh)}`;
    }
    return `count=${formatCommercialMetricKey(row.count)}|day=${formatCommercialMetricKey(row.dayKwh)}`;
  }

  /**
   * This report has no duplicate records. Still checks lookupId + DTR uniqueness
   * and same-MSN same-values same-DTR on the page.
   */
  validateUniqueIdentityFields(rows: DayNightRow[]): void {
    validateUniqueMeterIdentityAllowingDistinctMetric(
      rows,
      "Day Night",
      (row) => this.dayNightMetricKey(row),
    );
  }

  validateDuplicateContract(rows: DayNightRow[]): void {
    this.validateNoDuplicateConsumer(rows);
    this.validateUniqueIdentityFields(rows);
  }

  validatePagination(
    response: DayNightResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialPagination(response.data, query);
  }

  validateTotalCount(
    response: DayNightResponse,
    query: { month: number; year: number; page: number; pageSize: number },
  ): void {
    validateCommercialTotalCount(response.data, query);
  }
}
