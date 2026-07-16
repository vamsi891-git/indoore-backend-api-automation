import { expect } from "@playwright/test";
import type { PatternConsumptionPagination } from "../Mapper/patternconsumption.mapper";

export class PatternConsumptionValidator {
  validateTable(data: {
    title: string;
    columns: Array<{ key: string; label: string }>;
    rows: Record<string, unknown>[];
  }): void {
    expect(data.title).toBeTruthy();
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns.length).toBeGreaterThan(0);
    expect(Array.isArray(data.rows)).toBeTruthy();
  }

  validateRows(rows: Record<string, unknown>[]): void {
    expect(rows.length).toBeGreaterThan(0);
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
    expect(pagination.totalCount).toBeGreaterThanOrEqual(rowCount);
    expect(pagination.totalPages).toBeGreaterThanOrEqual(0);
    if (pagination.totalCount > 0) {
      expect(pagination.totalPages).toBe(
        Math.ceil(pagination.totalCount / pagination.pageSize),
      );
    }
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
      expect(row).toHaveProperty("ivrsNumber");
      expect(row).toHaveProperty("phase");
      expect(row).toHaveProperty("sanctionLoadKw");
      expect(row).toHaveProperty("name");
    });
  }

  validatePhase(rows: Record<string, unknown>[], allowedPhases: string[]): void {
    rows.forEach((row) => {
      if (row.phase) {
        expect(allowedPhases).toContain(row.phase);
      }
    });
  }

  validateSanctionLoad(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      expect(Number(row.sanctionLoadKw)).toBeGreaterThanOrEqual(0);
    });
  }

  validateNoNaN(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      Object.values(row).forEach((value) => {
        if (typeof value === "number") {
          expect(Number.isNaN(value)).toBeFalsy();
        }
      });
    });
  }

  validateComparison(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      expect(row).toHaveProperty("meterSerialNo");
      expect(row).toHaveProperty("categoryName");
      for (const field of [
        "currentMonthKwh",
        "lastMonthKwh",
        "lastYearSameMonthKwh",
      ]) {
        if (row[field] !== null && row[field] !== undefined) {
          expect(typeof row[field]).toBe("number");
          expect(Number(row[field])).toBeGreaterThanOrEqual(0);
        }
      }
    });
  }

  validateComparisonTitle(title: string, month: number, year: number): void {
    expect(title).toMatch(new RegExp(`Comparison\\s*\\(${month}/${year}\\)`, "i"));
  }

  validateLastThreeMonths(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      if (!row.monthWise) {
        return;
      }
      for (const month of ["DEC", "NOV", "OCT"]) {
        expect(row.monthWise).toHaveProperty(month);
        const data = (row.monthWise as Record<string, Record<string, unknown>>)[
          month
        ];
        for (const field of ["kwh", "kvah", "mdKw"]) {
          if (data[field] !== null && data[field] !== undefined) {
            expect(Number(data[field])).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  }

  validateYearly(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      expect(row).toHaveProperty("msn");
      expect(row).toHaveProperty("tariff");
      for (const field of [
        "janKwh",
        "febKwh",
        "marKwh",
        "aprKwh",
        "mayKwh",
        "junKwh",
        "julKwh",
        "augKwh",
        "sepKwh",
        "octKwh",
        "novKwh",
        "decKwh",
      ]) {
        if (row[field] !== null && row[field] !== undefined) {
          expect(Number(row[field])).toBeGreaterThanOrEqual(0);
        }
      }
      if (row.totalKwh !== null && row.totalKwh !== undefined) {
        expect(Number(row.totalKwh)).toBeGreaterThanOrEqual(0);
      }
    });
  }

  validateYearlyTotal(rows: Record<string, unknown>[]): void {
    rows.forEach((row) => {
      const months = [
        row.janKwh,
        row.febKwh,
        row.marKwh,
        row.aprKwh,
        row.mayKwh,
        row.junKwh,
        row.julKwh,
        row.augKwh,
        row.sepKwh,
        row.octKwh,
        row.novKwh,
        row.decKwh,
      ].filter((value) => value !== null && value !== undefined) as number[];
      const sum = months.reduce((acc, value) => acc + value, 0);
      if (row.totalKwh !== null && row.totalKwh !== undefined && sum > 0) {
        expect(Math.abs(sum - Number(row.totalKwh))).toBeLessThan(2);
      }
    });
  }

  validateYearlyTitle(title: string, year: number): void {
    expect(title).toMatch(new RegExp(`Yearly\\s*\\(${year}\\)`, "i"));
  }
}
