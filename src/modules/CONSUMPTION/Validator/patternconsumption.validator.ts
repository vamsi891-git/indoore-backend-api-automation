import { expect } from "@playwright/test";
import type { PatternConsumptionPagination } from "../Mapper/patternconsumption.mapper";
import { compareConsumptionPatternTotalToDb } from "../Db/consumption-db-compare";
import {
  patternIdentityRows,
  validateSharedHierarchyAllowed as assertSharedHierarchyAllowed,
  validateUniqueConsumerKeys,
} from "../utils/consumption-identity.helper";

function round5(n: number): number {
  return Number(n.toFixed(5));
}

function hasAtMost5Decimals(n: number): boolean {
  return round5(n) === n;
}

/** Matches backend `lastThreeMonthLabels` month keys (UTC short month). */
export function lastThreeMonthKeys(year: number, month: number): string[] {
  const base = new Date(Date.UTC(year, month - 1, 1));
  return [0, 1, 2].map((offset) => {
    const d = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - offset, 1),
    );
    return d
      .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      .toUpperCase();
  });
}

function lastThreeMonthLabels(year: number, month: number): string[] {
  const base = new Date(Date.UTC(year, month - 1, 1));
  return [0, 1, 2].map((offset) => {
    const d = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - offset, 1),
    );
    return d.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  });
}

export class PatternConsumptionValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateTable(data: {
    title: string;
    columns: Array<{ key: string; label: string }>;
    rows: Record<string, unknown>[];
  }): void {
    expect(typeof data.title).toBe("string");
    expect(data.title.trim().length).toBeGreaterThan(0);
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns.length).toBeGreaterThan(0);
    data.columns.forEach((col) => {
      expect(typeof col.key).toBe("string");
      expect(col.key.trim().length).toBeGreaterThan(0);
      expect(typeof col.label).toBe("string");
      expect(col.label.trim().length).toBeGreaterThan(0);
    });
    expect(Array.isArray(data.rows)).toBeTruthy();
  }

  validateRows(rows: Record<string, unknown>[]): void {
    expect(rows.length).toBeGreaterThan(0);
  }

  validateRowsWithinLimit(rows: Record<string, unknown>[], limit: number): void {
    expect(rows.length).toBeLessThanOrEqual(limit);
  }

  validateUniqueConsumers(rows: Record<string, unknown>[]): void {
    validateUniqueConsumerKeys(patternIdentityRows(rows));
  }

  validateSharedHierarchyAllowed(rows: Record<string, unknown>[]): void {
    assertSharedHierarchyAllowed(patternIdentityRows(rows));
  }

  validateSlNo(
    rows: Record<string, unknown>[],
    page = 1,
    pageSize = rows.length,
  ): void {
    const base = (page - 1) * pageSize;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  validatePagination(
    pagination: PatternConsumptionPagination,
    page: number,
    limit: number,
    rowCount: number,
  ): void {
    expect(pagination.page).toBe(page);
    expect(pagination.pageSize).toBe(limit);
    expect(pagination.totalCount).toBeGreaterThanOrEqual(0);
    expect(pagination.totalPages).toBeGreaterThanOrEqual(0);
    expect(rowCount).toBeLessThanOrEqual(limit);
    expect(pagination.totalCount).toBeGreaterThanOrEqual(rowCount);
    if (pagination.totalCount === 0) {
      expect(pagination.totalPages).toBe(0);
      expect(rowCount).toBe(0);
      return;
    }
    expect(pagination.totalPages).toBe(
      Math.ceil(pagination.totalCount / pagination.pageSize),
    );
  }

  /**
   * Soft DB: `table.pagination.totalCount` vs unscoped page-key COUNT
   * (`consumptionPageKeyFromSql`). Prefer exact match; allow API ≤ DB (JWT).
   * Pass `dbCount=null` to skip when SQL is not ready.
   */
  validateTotalCountAgainstDb(
    pagination: PatternConsumptionPagination,
    dbCount: number | null,
    label = "pattern.totalCount",
  ): void {
    if (dbCount == null) return;
    compareConsumptionPatternTotalToDb({
      label,
      apiCount: pagination.totalCount,
      dbCount,
    });
  }

  validateColumnKeys(
    columns: Array<{ key: string; label: string }>,
    expectedKeys: string[],
  ): void {
    const keys = columns.map((column) => column.key);
    expectedKeys.forEach((key) => {
      expect(keys).toContain(key);
    });
  }

  validateRequiredFields(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      expect(row).toHaveProperty("slNo");
      expect(row).toHaveProperty("name");
      expect(row).toHaveProperty("ivrsNumber");
      expect(row).toHaveProperty("phase");
      expect(row).toHaveProperty("sanctionLoadKw");
    });
  }

  /** Soft: phase is string|null. Do not pin a live allow-list. */
  validatePhase(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      const phase = row.phase;
      expect(phase === null || typeof phase === "string").toBeTruthy();
    });
  }

  validateSanctionLoad(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      if (row.sanctionLoadKw == null) return;
      expect(typeof row.sanctionLoadKw).toBe("number");
      expect(Number(row.sanctionLoadKw)).toBeGreaterThanOrEqual(0);
    });
  }

  validateNoNaN(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      const walk = (value: unknown): void => {
        if (typeof value === "number") {
          expect(Number.isNaN(value)).toBeFalsy();
        } else if (value && typeof value === "object") {
          Object.values(value as Record<string, unknown>).forEach(walk);
        }
      };
      walk(row);
    });
  }

  validateLastThreeTitle(title: string, month: number, year: number): void {
    const labels = lastThreeMonthLabels(year, month);
    expect(title).toMatch(/Last Three Months/i);
    labels.forEach((label) => {
      expect(title).toContain(label);
    });
  }

  validateLastThreeMonths(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      expect(row).toHaveProperty("msn");
      expect(row).toHaveProperty("tariff");
      for (const field of [
        "m0Kwh",
        "m0Kvah",
        "m0Md",
        "m1Kwh",
        "m1Kvah",
        "m1Md",
        "m2Kwh",
        "m2Kvah",
        "m2Md",
      ] as const) {
        const value = row[field];
        expect(value === null || typeof value === "number").toBeTruthy();
        if (typeof value === "number") {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(hasAtMost5Decimals(value)).toBeTruthy();
        }
      }
    });
  }

  validateComparison(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      expect(row).toHaveProperty("meterSerialNo");
      expect(row).toHaveProperty("categoryName");
      for (const field of [
        "circle",
        "division",
        "zone",
        "subStation",
        "feeder",
        "dtr",
        "address",
        "phase",
      ] as const) {
        const value = row[field];
        expect(
          value === null || value === undefined || typeof value === "string",
        ).toBeTruthy();
      }
      for (const field of [
        "currentMonthKwh",
        "lastMonthKwh",
        "lastYearSameMonthKwh",
      ]) {
        const value = row[field];
        expect(value === null || typeof value === "number").toBeTruthy();
        if (typeof value === "number") {
          // Comparison LAG deltas are not clamped with GREATEST — may be negative.
          expect(hasAtMost5Decimals(value)).toBeTruthy();
        }
      }
    });
  }

  validateComparisonTitle(title: string, month: number, year: number): void {
    expect(title).toMatch(
      new RegExp(`Comparison\\s*\\(${month}/${year}\\)`, "i"),
    );
  }

  validateYearly(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      expect(row).toHaveProperty("msn");
      expect(row).toHaveProperty("tariff");
      for (const field of [
        "circle",
        "division",
        "zone",
        "subStation",
        "feeder",
        "dtr",
        "address",
        "serviceDate",
      ] as const) {
        const value = row[field];
        expect(
          value === null || value === undefined || typeof value === "string",
        ).toBeTruthy();
      }
      for (const month of [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ]) {
        for (const suffix of ["Kwh", "MdKw"] as const) {
          const field = `${month}${suffix}`;
          const value = row[field];
          expect(value === null || typeof value === "number").toBeTruthy();
          if (typeof value === "number") {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(hasAtMost5Decimals(value)).toBeTruthy();
          }
        }
      }
      if (row.initialKwh != null) {
        expect(typeof row.initialKwh).toBe("number");
        expect(Number(row.initialKwh)).toBeGreaterThanOrEqual(0);
        expect(hasAtMost5Decimals(Number(row.initialKwh))).toBeTruthy();
      }
    });
  }

  /** Soft: `initialKwh` is an opening reading — not a sum of monthly kWh. */
  validateYearlyInitialKwh(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      expect(
        row.initialKwh === null ||
          row.initialKwh === undefined ||
          typeof row.initialKwh === "number",
      ).toBeTruthy();
    });
  }

  validateYearlyTitle(title: string, year: number): void {
    expect(title).toMatch(new RegExp(`Yearly\\s*\\(${year}\\)`, "i"));
  }
}
