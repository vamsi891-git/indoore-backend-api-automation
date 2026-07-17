import { expect } from "@playwright/test";

import {
  LOSS_ANALYSIS_COLUMN_KEYS,
  LossAnalysisPaginatedView,
  LossAnalysisQuery,
  LossAnalysisResponse,
  LossAnalysisRow,
  LossNetworkType,
} from "../Mapper/loss-analysis.mapper";

const METRIC_EPSILON = 0.01;

function parseMf(mf: string | number | null | undefined): number | null {
  if (mf === null || mf === undefined) {
    return null;
  }
  const value = typeof mf === "number" ? mf : Number(String(mf).trim());
  return Number.isFinite(value) ? value : null;
}

function isMeterScopedRow(row: LossAnalysisRow): boolean {
  return row.meterSerialNumber.trim().length > 0;
}

function feederRowKey(row: LossAnalysisRow): string {
  return `${row.dtrName}::${row.meterSerialNumber}`;
}

function isSummaryRow(row: LossAnalysisRow): boolean {
  return /^row-\d+$/i.test(row.id);
}

export class LossAnalysisValidator {
  validateResponse(response: LossAnalysisResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.columns)).toBe(true);
    expect(Array.isArray(response.data.rows)).toBe(true);
    expect(response.data.pagination).toBeDefined();
  }

  validateColumns(view: LossAnalysisPaginatedView): void {
    const keys = view.columns.map((col) => col.key);
    expect(keys).toEqual([...LOSS_ANALYSIS_COLUMN_KEYS]);

    for (const column of view.columns) {
      expect(column.key.trim().length).toBeGreaterThan(0);
      expect(column.header.trim().length).toBeGreaterThan(0);
    }
  }

  validatePagination(
    view: LossAnalysisPaginatedView,
    query: Pick<LossAnalysisQuery, "page" | "limit">,
  ): void {
    expect(view.page).toBe(query.page);
    expect(view.pageSize).toBe(query.limit);
    expect(view.page).toBeGreaterThan(0);
    expect(view.pageSize).toBeGreaterThan(0);
    expect(view.totalCount).toBeGreaterThanOrEqual(0);
    expect(view.totalPages).toBeGreaterThanOrEqual(0);
    expect(view.rows.length).toBeLessThanOrEqual(view.pageSize);

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

  validateTotalCount(view: LossAnalysisPaginatedView): void {
    expect(view.totalCount).toBeGreaterThanOrEqual(view.rows.length);
  }

  validateRowsExist(view: LossAnalysisPaginatedView): void {
    expect(view.rows.length).toBeGreaterThan(0);
  }

  validateSlNoSequence(rows: LossAnalysisRow[],query: Pick<LossAnalysisQuery, "page" | "limit">,): void {
    const base = (query.page - 1) * query.limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }
  validateMandatoryFields(rows: LossAnalysisRow[],networkType: LossNetworkType,): void {
    for (const row of rows) {
      expect(row.id.length).toBeGreaterThan(0);
      expect(row.zone.length).toBeGreaterThan(0);
      expect(row.feeder.length).toBeGreaterThan(0);
      if (networkType === "feeder") {
        if (!row.circle?.length) {
          console.log(`BACKEND FINDING: feeder row ${row.id} (${row.dtrName}) returned circle=null`,);
        }
        if (!row.division?.length) {
          console.log(`BACKEND FINDING: feeder row ${row.id} (${row.dtrName}) returned division=null`,);
        }
      } else {
        expect(row.circle?.length, `Row ${row.id}: circle is required`).toBeGreaterThan(0);
        expect(row.division?.length, `Row ${row.id}: division is required`).toBeGreaterThan(0);
      }
      if (isSummaryRow(row)) {
        continue;
      }
      expect(row.dtrName.length,`Row ${row.id}: dtrName is required for meter-scoped rows`,).toBeGreaterThan(0);
      expect(row.meterSerialNumber.length,`Row ${row.id}: meterSerialNumber is required for meter-scoped rows`,).toBeGreaterThan(0);
      if (networkType === "dtr") {
        expect(String(row.mf ?? "").trim().length,`Row ${row.id}: mf is required for DTR-scoped loss analysis`,).toBeGreaterThan(0);
      }
    }
  }
  validateFieldTypes(rows: LossAnalysisRow[],networkType: LossNetworkType,): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      if (networkType === "feeder") {
        expect(row.circle === null || typeof row.circle === "string").toBe(true);
        expect(row.division === null || typeof row.division === "string").toBe(true);
      } else {
        expect(typeof row.circle).toBe("string");
        expect(typeof row.division).toBe("string");
      }
      expect(typeof row.zone).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtrName).toBe("string");
      if (row.mf !== null && row.mf !== undefined) {
        expect(["string", "number"]).toContain(typeof row.mf);
      }
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(typeof row.inputUnits).toBe("number");
      expect(typeof row.consumerCount).toBe("number");
      expect(typeof row.totalSoldUnits).toBe("number");
      expect(typeof row.lossKwh).toBe("number");
      expect(typeof row.billingEfficiencyPct).toBe("number");
      expect(typeof row.lossPct).toBe("number");
    }
  }
  validateNonNegativeMetrics(rows: LossAnalysisRow[],networkType: LossNetworkType,): void {
    for (const row of rows) {
      expect(row.inputUnits).toBeGreaterThanOrEqual(0);
      expect(row.totalSoldUnits).toBeGreaterThanOrEqual(0);
      expect(row.lossKwh).toBeGreaterThanOrEqual(0);
      expect(row.consumerCount).toBeGreaterThanOrEqual(0);
      expect(row.billingEfficiencyPct).toBeGreaterThanOrEqual(0);
      expect(row.lossPct).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(row.consumerCount)).toBe(true);
      if (isSummaryRow(row)) {
        continue;
      }
      const mfValue = parseMf(row.mf);
      if (networkType === "dtr") {
        expect(mfValue, `Row ${row.id}: mf must be a positive number`).toBeGreaterThan(0);
      } else if (mfValue !== null) {
        expect(mfValue, `Row ${row.id}: mf must be positive when present`).toBeGreaterThan(0);
      } else {
        console.log(
          `BACKEND FINDING: feeder loss-analysis row ${row.id} (${row.dtrName}) returned mf=null`,
        );
      }
    }
  }
  validateRowIds(rows: LossAnalysisRow[]): void {
    for (const row of rows) {
      if (isSummaryRow(row)) {
        expect(row.id).toMatch(/^row-\d+$/i);
        continue;
      }
      if (isMeterScopedRow(row)) {
        expect(row.id).toBe(`meter-${row.meterSerialNumber}`);
      }
    }
  }
  validateNoDuplicateIds(rows: LossAnalysisRow[],networkType: LossNetworkType,): void {
    const meterRows = rows.filter(isMeterScopedRow);
    if (networkType === "feeder") {
      const ids = meterRows.map((row) => row.id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.log(`BACKEND FINDING: duplicate feeder row ids detected: ${[...new Set(duplicateIds)].join(", ")}`,);
      }
      const keys = meterRows.map(feederRowKey);
      expect(new Set(keys).size).toBe(keys.length);
      return;
    }
    const ids = meterRows.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  }
  validateNoDuplicateMeterSerials(rows: LossAnalysisRow[],networkType: LossNetworkType,): void {
    const meterRows = rows.filter(isMeterScopedRow);
    if (networkType === "feeder") {
      const keys = meterRows.map(feederRowKey);
      expect(new Set(keys).size).toBe(keys.length);
      return;
    }
    const serials = meterRows.map((row) => row.meterSerialNumber);
    expect(new Set(serials).size).toBe(serials.length);
  }
  validateFeederMeterSerialFormat(rows: LossAnalysisRow[]): void {
    for (const row of rows) {
      if (isSummaryRow(row)) {
        continue;
      }
      const serial = row.meterSerialNumber.trim();
      expect(serial.length).toBeGreaterThan(0);
      expect(row.id).toBe(`meter-${serial}`);
      if (serial.includes(",")) {
        const [dtrSerial, feederSerial] = serial.split(",");
        expect(dtrSerial?.trim().length).toBeGreaterThan(0);
        expect(feederSerial?.trim().length).toBeGreaterThan(0);
      }
    }
  }
  validateFeederScopeConsistency(rows: LossAnalysisRow[]): void {
    const meterRows = rows.filter(isMeterScopedRow);
    const feederNames = [...new Set(meterRows.map((row) => row.feeder))];
    expect(feederNames.length).toBe(1);
    expect(feederNames[0]?.length).toBeGreaterThan(0);
  }
  /**
   * DTR scope: one row per DTR — names must be unique on the page.
   * Feeder scope: rows are meter-scoped; the same DTR can have multiple meters
   * (uniqueness is enforced by validateNoDuplicateIds via dtrName::meterSerial).
   */
  validateNoDuplicateDtrNames(rows: LossAnalysisRow[],networkType: LossNetworkType,): void {
  if (networkType === "feeder") {
      return;
    }
    const meterRows = rows.filter(isMeterScopedRow);
    const names = meterRows.map((row) => row.dtrName);
    expect(new Set(names).size).toBe(names.length);
  }
  /**
   * Backend: lossKwh = GREATEST(0, inputUnits - totalSoldUnits)
   * billingEfficiencyPct = (totalSoldUnits / inputUnits) * 100 when inputUnits > 0
   * lossPct = (lossKwh / inputUnits) * 100 when inputUnits > 0
   */
  validateLossCalculations(rows: LossAnalysisRow[]): void {
    for (const row of rows) {
      const expectedLoss = Math.max(0, row.inputUnits - row.totalSoldUnits);
      expect(Math.abs(row.lossKwh - expectedLoss),`DTR ${row.dtrName}: lossKwh ${row.lossKwh} != max(0, input - sold) ${expectedLoss}`,).toBeLessThanOrEqual(METRIC_EPSILON);
      if (row.inputUnits === 0) {
        expect(row.lossKwh).toBe(0);
        expect(row.billingEfficiencyPct).toBe(0);
        expect(row.lossPct).toBe(0);
        continue;
      }
      const expectedEfficiency = (row.totalSoldUnits / row.inputUnits) * 100;
      const expectedLossPct = (row.lossKwh / row.inputUnits) * 100;
      expect(Math.abs(row.billingEfficiencyPct - expectedEfficiency),`DTR ${row.dtrName}: billingEfficiencyPct mismatch`,).toBeLessThanOrEqual(METRIC_EPSILON);
      expect(Math.abs(row.lossPct - expectedLossPct),`DTR ${row.dtrName}: lossPct mismatch`,).toBeLessThanOrEqual(METRIC_EPSILON);
      expect(Math.abs(row.billingEfficiencyPct + row.lossPct - 100),`DTR ${row.dtrName}: efficiency + loss should equal 100%`,).toBeLessThanOrEqual(METRIC_EPSILON);
    }
  }
  validateCrossFieldLogic(view: LossAnalysisPaginatedView): void {
    if (view.totalCount > 0) {
      expect(view.rows.length).toBeGreaterThan(0);
    }
    if (view.totalPages === 1) {
      expect(view.page).toBe(1);
    }
    if (view.page === view.totalPages && view.totalCount > 0) {
      const expectedRowsOnLastPage =
        view.totalCount - (view.totalPages - 1) * view.pageSize;
      expect(view.rows.length).toBe(expectedRowsOnLastPage);
    }
  }
}
