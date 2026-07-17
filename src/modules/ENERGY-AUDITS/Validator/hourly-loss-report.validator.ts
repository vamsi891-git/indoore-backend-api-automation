import { expect } from "@playwright/test";
import {
  getHourlyBucketValues,
  HOURLY_BUCKET_KEYS,
  HOURLY_LOSS_COLUMN_KEYS,
  HourlyLossHierarchyType,
  HourlyLossReportPaginatedView,
  HourlyLossReportQuery,
  HourlyLossReportResponse,
  HourlyLossReportRow,
} from "../Mapper/hourly-loss-report.mapper";
const METRIC_EPSILON = 0.01;
const KNOWN_ROW_KINDS = new Set([
  "DTRCONSUMPTION",
  "CONSUMERCONSUMPTION",
  "LOSSPERCENTAGE",
  "CONSUMER",
  "DTR",
  "LOSS",
]);
function normalizeRowKind(rowKind: string): string {
  return rowKind.trim().toUpperCase();
}
function isDtrConsumptionRow(row: HourlyLossReportRow): boolean {
  return normalizeRowKind(row.rowKind) === "DTRCONSUMPTION";
}
function isConsumerConsumptionRow(row: HourlyLossReportRow): boolean {
  return normalizeRowKind(row.rowKind) === "CONSUMERCONSUMPTION";
}
function isLossPercentageRow(row: HourlyLossReportRow): boolean {
  return normalizeRowKind(row.rowKind) === "LOSSPERCENTAGE";
}
function isConsumerDetailRow(row: HourlyLossReportRow): boolean {
  return (
    normalizeRowKind(row.rowKind) === "CONSUMER" &&
    Boolean(row.meterSerialNumber?.length)
  );
}
function isSummaryRowKind(row: HourlyLossReportRow): boolean {
  return (
    isDtrConsumptionRow(row) ||
    isConsumerConsumptionRow(row) ||
    isLossPercentageRow(row)
  );
}

function parseMf(mf: string | number | null | undefined): number | null {
  if (mf === null || mf === undefined) {
    return null;
  }
  const value = typeof mf === "number" ? mf : Number(String(mf).trim());
  return Number.isFinite(value) ? value : null;
}

export class HourlyLossReportValidator {
  validateResponse(response: HourlyLossReportResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.columns)).toBe(true);
    expect(Array.isArray(response.data.rows)).toBe(true);
    expect(response.data.pagination).toBeDefined();
  }

  validateColumns(view: HourlyLossReportPaginatedView): void {
    const keys = view.columns.map((col) => col.key);
    expect(keys).toEqual([...HOURLY_LOSS_COLUMN_KEYS]);

    for (const column of view.columns) {
      expect(column.key.trim().length).toBeGreaterThan(0);
      expect(column.header.trim().length).toBeGreaterThan(0);
    }
  }

  validatePagination(
    view: HourlyLossReportPaginatedView,
    query: Pick<HourlyLossReportQuery, "page" | "limit">,
  ): void {
    expect(view.page).toBe(query.page);
    expect(view.pageSize).toBe(query.limit);
    expect(view.page).toBeGreaterThan(0);
    expect(view.pageSize).toBeGreaterThan(0);
    expect(view.totalCount).toBeGreaterThanOrEqual(0);
    expect(view.totalPages).toBeGreaterThanOrEqual(0);
    expect(view.rows.length).toBeLessThanOrEqual(view.pageSize * 3);

    if (view.totalCount === 0) {
      expect(view.totalPages).toBe(0);
      expect(view.rows.length).toBe(0);
      return;
    }

    expect(view.totalPages).toBeGreaterThan(0);
    const expectedTotalPages = Math.max(
      1,
      Math.ceil(view.totalCount / view.pageSize),
    );
    expect(view.totalPages).toBe(expectedTotalPages);
  }

  validateTotalCount(view: HourlyLossReportPaginatedView): void {
    if (view.totalCount === 0) {
      expect(view.rows.length).toBe(0);
      return;
    }

    // pagination.total counts paginated DTR entities; each DTR emits multiple summary rows.
    if (view.rows.length < view.totalCount) {
      console.log(
        `BACKEND FINDING: pagination.total=${view.totalCount} but rows.length=${view.rows.length}`,
      );
    }
  }

  validateNoDataScenario(view: HourlyLossReportPaginatedView): void {
    expect(view.totalCount).toBe(0);
    expect(view.totalPages).toBe(0);
    expect(view.rows.length).toBe(0);
  }

  validateRowsExist(view: HourlyLossReportPaginatedView): void {
    expect(view.rows.length).toBeGreaterThan(0);
  }

  validateRowKinds(rows: HourlyLossReportRow[]): void {
    for (const row of rows) {
      expect(row.rowKind.trim().length).toBeGreaterThan(0);
      if (!KNOWN_ROW_KINDS.has(normalizeRowKind(row.rowKind))) {
        console.log(`BACKEND FINDING: unknown hourly-loss rowKind '${row.rowKind}'`);
      }
    }
  }

  validateDtrSummaryRowKinds(rows: HourlyLossReportRow[]): void {
    const kinds = new Set(rows.map((row) => normalizeRowKind(row.rowKind)));
    if (rows.some(isSummaryRowKind)) {
      expect(kinds.has("DTRCONSUMPTION")).toBe(true);
      expect(kinds.has("CONSUMERCONSUMPTION")).toBe(true);
      expect(kinds.has("LOSSPERCENTAGE")).toBe(true);
    }
  }

  validateSummaryRowIds(rows: HourlyLossReportRow[]): void {
    for (const row of rows) {
      if (!isSummaryRowKind(row) || !row.id) {
        continue;
      }

      if (isDtrConsumptionRow(row)) {
        expect(row.id).toMatch(/^summary-dtr-\d+$/i);
      } else if (isConsumerConsumptionRow(row)) {
        expect(row.id).toMatch(/^summary-consumer-\d+$/i);
      } else if (isLossPercentageRow(row)) {
        expect(row.id).toMatch(/^summary-loss-\d+$/i);
      }
    }

    const suffixes = rows
      .filter(isSummaryRowKind)
      .map((row) => row.id?.split("-").pop())
      .filter(Boolean);
    if (suffixes.length > 0) {
      expect(new Set(suffixes).size).toBe(1);
    }
  }

  validateSummaryRowCount(
    view: HourlyLossReportPaginatedView,
  ): void {
    if (view.totalCount === 0) {
      return;
    }

    const summaryRows = view.rows.filter(isSummaryRowKind);
    if (summaryRows.length === 0) {
      return;
    }

    expect(view.rows.length).toBeGreaterThanOrEqual(view.totalCount * 3);
  }

  validateSharedSummaryContext(rows: HourlyLossReportRow[]): void {
    const summaryRows = rows.filter(isSummaryRowKind);
    if (summaryRows.length < 2) {
      return;
    }

    const dtrNames = new Set(summaryRows.map((row) => row.dtrName));
    const dtrMeters = new Set(summaryRows.map((row) => row.dtrMeterSerialNumber));
    const feeders = new Set(summaryRows.map((row) => row.feeder));

    expect(dtrNames.size).toBe(1);
    expect(dtrMeters.size).toBe(1);
    expect(feeders.size).toBe(1);
  }

  validateSummaryHierarchyFields(rows: HourlyLossReportRow[]): void {
    for (const row of rows.filter(isSummaryRowKind)) {
      expect(row.circle?.length, `Row ${row.rowKind}: circle is required`).toBeGreaterThan(0);
      expect(row.division?.length, `Row ${row.rowKind}: division is required`).toBeGreaterThan(0);
      expect(row.zone?.length, `Row ${row.rowKind}: zone is required`).toBeGreaterThan(0);
      expect(row.substation?.length, `Row ${row.rowKind}: substation is required`).toBeGreaterThan(0);
      expect(row.feeder?.length, `Row ${row.rowKind}: feeder is required`).toBeGreaterThan(0);
    }
  }

  validateFieldTypes(rows: HourlyLossReportRow[]): void {
    for (const row of rows) {
      expect(typeof row.rowKind).toBe("string");
      expect(row.circle === null || typeof row.circle === "string").toBe(true);
      expect(row.division === null || typeof row.division === "string").toBe(true);
      expect(row.zone === null || typeof row.zone === "string").toBe(true);
      expect(row.substation === null || typeof row.substation === "string").toBe(true);
      expect(row.feeder === null || typeof row.feeder === "string").toBe(true);
      expect(row.dtrName === null || typeof row.dtrName === "string").toBe(true);
      expect(row.dtrMeterSerialNumber === null || typeof row.dtrMeterSerialNumber === "string").toBe(true);
      expect(row.consumerName === null || typeof row.consumerName === "string").toBe(true);
      expect(row.meterSerialNumber === null || typeof row.meterSerialNumber === "string").toBe(true);
      if (row.mf !== null && row.mf !== undefined) {
        expect(["string", "number"]).toContain(typeof row.mf);
      }
      expect(typeof row.total).toBe("number");

      for (const key of HOURLY_BUCKET_KEYS) {
        expect(typeof row[key]).toBe("number");
      }
    }
  }

  validateMandatoryFields(rows: HourlyLossReportRow[],hierarchyType: HourlyLossHierarchyType,): void {
    for (const row of rows) {
      expect(row.rowKind.trim().length).toBeGreaterThan(0);
      if (isSummaryRowKind(row) || isConsumerDetailRow(row)) {
        expect(row.dtrName?.length,`Row ${row.rowKind}: dtrName is required`,).toBeGreaterThan(0);
        expect(row.consumerName?.length,`Row ${row.rowKind}: consumerName is required`,).toBeGreaterThan(0);
      }
      if (isDtrConsumptionRow(row) || isConsumerConsumptionRow(row) || isLossPercentageRow(row)) {
        expect(row.dtrMeterSerialNumber?.length,`Row ${row.rowKind}: dtrMeterSerialNumber is required`,).toBeGreaterThan(0);
      }
      if (isConsumerDetailRow(row)) {
        expect(row.meterSerialNumber?.length,`Row ${row.rowKind}: meterSerialNumber is required`,).toBeGreaterThan(0);
      }
      if (hierarchyType === "feeder" && !row.feeder?.length) {
        console.log(`BACKEND FINDING: feeder hourly-loss row '${row.rowKind}' missing feeder name`,);
      }
    }
  }
  validateNonNegativeHourlyMetrics(rows: HourlyLossReportRow[]): void {
    for (const row of rows) {
      expect(row.total).toBeGreaterThanOrEqual(0);
      for (const value of getHourlyBucketValues(row)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(Number.isNaN(value)).toBe(false);
      }
      const mfValue = parseMf(row.mf);
      if (isSummaryRowKind(row)) {
        expect(mfValue, `Row ${row.rowKind}: mf is required on summary rows`).toBeGreaterThan(0);
      } else if (mfValue !== null) {
        expect(mfValue).toBeGreaterThan(0);
      }
    }
  }
  validateTotalEqualsHourlySum(rows: HourlyLossReportRow[]): void {
    for (const row of rows) {
      const hourlySum = getHourlyBucketValues(row).reduce((sum, value) => sum + value, 0);
      expect(Math.abs(row.total - hourlySum),`Row ${row.rowKind}: total ${row.total} != sum(H1..H24) ${hourlySum}`,).toBeLessThanOrEqual(METRIC_EPSILON);
    }
  }
  validateSummaryLossMath(rows: HourlyLossReportRow[]): void {
    const dtrRow = rows.find(isDtrConsumptionRow);
    const consumerRow = rows.find(isConsumerConsumptionRow);
    const lossRow = rows.find(isLossPercentageRow);
    if (!dtrRow || !consumerRow || !lossRow) {
      return;
    }
    for (const key of HOURLY_BUCKET_KEYS) {
      const dtrValue = dtrRow[key];
      const consumerValue = consumerRow[key];
      const lossPct = lossRow[key];
      if (dtrValue === 0) {
        expect(lossPct).toBe(0);
        continue;
      }
      const expectedPct = ((dtrValue - consumerValue) / dtrValue) * 100;
      expect(lossPct).toBeGreaterThanOrEqual(0);
      expect(lossPct).toBeLessThanOrEqual(100);
      expect(Math.abs(lossPct - expectedPct),`${key}: lossPercentage mismatch`,).toBeLessThanOrEqual(METRIC_EPSILON);
    }
    if (dtrRow.total === 0) {
      expect(lossRow.total).toBe(0);
      return;
    }
    const expectedTotalPct =
      ((dtrRow.total - consumerRow.total) / dtrRow.total) * 100;
    expect(Math.abs(lossRow.total - expectedTotalPct),"lossPercentage total mismatch",).toBeLessThanOrEqual(METRIC_EPSILON);
  }
  validateNoDuplicateConsumerMeters(rows: HourlyLossReportRow[]): void {
    const consumerRows = rows.filter(isConsumerDetailRow);
    const keys = consumerRows.map(
      (row) => `${row.dtrName ?? ""}::${row.meterSerialNumber ?? ""}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  }
  validateCrossFieldLogic(view: HourlyLossReportPaginatedView): void {
    if (view.totalCount > 0) {
      expect(view.rows.length).toBeGreaterThan(0);
    }
    if (view.totalPages === 1 && view.totalCount > 0) {
      expect(view.page).toBe(1);
    }
    if (view.page === view.totalPages && view.totalCount > 0) {
      expect(view.rows.length).toBeGreaterThanOrEqual(view.totalCount);
    }
  }
}
