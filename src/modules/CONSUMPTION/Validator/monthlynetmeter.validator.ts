import { expect } from "@playwright/test";
import {
  MonthlyNetMeterData,
  MonthlyNetMeterItem,
} from "../Mapper/monthlynetmeter.mapper";
import {
  validateSharedHierarchyAllowed as assertSharedHierarchyAllowed,
  validateUniqueConsumerKeys,
} from "../utils/consumption-identity.helper";

const ITEM_REQUIRED_FIELDS = [
  "slNo",
  "circle",
  "division",
  "subDivision",
  "zone",
  "feeder",
  "dtr",
  "name",
  "address",
  "ivrsNumber",
  "category",
  "msn",
  "phase",
  "subStation",
  "kwh",
  "kvah",
  "kwhExport",
  "kvahExport",
  "netKwh",
  "netKvah",
] as const;

function round5(n: number): number {
  return Number(n.toFixed(5));
}

function hasAtMost5Decimals(n: number): boolean {
  return round5(n) === n;
}

export class MonthlyNetMeterValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateRootStructure(data: MonthlyNetMeterData): void {
    expect(Array.isArray(data.items)).toBeTruthy();
    expect(typeof data.total).toBe("number");
    expect(typeof data.page).toBe("number");
    expect(typeof data.limit).toBe("number");
    expect(typeof data.totalPages).toBe("number");
  }

  validateQueryEcho(
    data: MonthlyNetMeterData,
    page: number,
    limit: number,
  ): void {
    expect(data.page).toBe(page);
    expect(data.limit).toBe(limit);
  }

  validatePaginationBounds(data: MonthlyNetMeterData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.items.length).toBeLessThanOrEqual(data.limit);
  }

  validatePaginationMath(data: MonthlyNetMeterData): void {
    if (data.total === 0) {
      expect(data.items.length).toBe(0);
      expect(data.totalPages).toBe(0);
      return;
    }
    expect(data.totalPages).toBe(Math.ceil(data.total / data.limit));
    expect(data.total).toBeGreaterThanOrEqual(data.items.length);
  }

  validateItemsPresentWhenTotalPositive(data: MonthlyNetMeterData): void {
    if (data.total > 0 && data.page === 1) {
      expect(data.items.length).toBeGreaterThan(0);
    }
  }

  /** @deprecated Prefer validateRootStructure — kept for older specs. */
  validateItems(data: MonthlyNetMeterData): void {
    this.validateRootStructure(data);
  }

  /** @deprecated Prefer validatePaginationBounds — kept for older specs. */
  validatePagination(data: MonthlyNetMeterData): void {
    this.validatePaginationBounds(data);
  }

  validateRequiredFields(items: MonthlyNetMeterItem[]): void {
    items.forEach((item) => {
      ITEM_REQUIRED_FIELDS.forEach((field) => {
        expect(item).toHaveProperty(field);
      });
    });
  }

  validateItemStructure(items: MonthlyNetMeterItem[]): void {
    items.forEach((item) => {
      expect(typeof item.slNo).toBe("number");
      expect(item.slNo).toBeGreaterThan(0);
      for (const field of [
        "circle",
        "division",
        "subDivision",
        "zone",
        "feeder",
        "dtr",
        "name",
        "address",
        "ivrsNumber",
        "category",
        "msn",
        "phase",
        "subStation",
      ] as const) {
        const value = item[field];
        expect(value === null || typeof value === "string").toBeTruthy();
      }
      for (const field of [
        "kwh",
        "kvah",
        "kwhExport",
        "kvahExport",
        "netKwh",
        "netKvah",
      ] as const) {
        const value = item[field];
        expect(value === null || typeof value === "number").toBeTruthy();
      }
    });
  }

  /** @deprecated Prefer validateItemStructure. */
  validateTypes(items: MonthlyNetMeterItem[]): void {
    this.validateItemStructure(items);
  }

  validateSerialSequence(
    items: MonthlyNetMeterItem[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    items.forEach((item, index) => {
      expect(item.slNo).toBe(base + index + 1);
    });
  }

  validateUniqueSerialNumbers(items: MonthlyNetMeterItem[]): void {
    validateUniqueConsumerKeys(items);
  }

  validateSharedHierarchyAllowed(items: MonthlyNetMeterItem[]): void {
    assertSharedHierarchyAllowed(items);
  }

  /**
   * Import/export are ≥0 when present; net = import − export (may be negative).
   * Backend applies round5 to all energy fields.
   */
  validateNetKwhLogic(items: MonthlyNetMeterItem[]): void {
    items.forEach((item) => {
      if (item.kwh != null && item.kwhExport != null) {
        expect(item.netKwh).not.toBeNull();
        expect(item.netKwh).toBe(round5(item.kwh - item.kwhExport));
      }
    });
  }

  validateNetKvahLogic(items: MonthlyNetMeterItem[]): void {
    items.forEach((item) => {
      if (item.kvah != null && item.kvahExport != null) {
        expect(item.netKvah).not.toBeNull();
        expect(item.netKvah).toBe(round5(item.kvah - item.kvahExport));
      }
    });
  }

  validateNullHandling(items: MonthlyNetMeterItem[]): void {
    items.forEach((item) => {
      if (item.kwh === null || item.kwhExport === null) {
        expect(item.netKwh).toBeNull();
      }
      if (item.kvah === null || item.kvahExport === null) {
        expect(item.netKvah).toBeNull();
      }
    });
  }

  validateImportExportNonNegative(items: MonthlyNetMeterItem[]): void {
    items.forEach((item) => {
      for (const value of [item.kwh, item.kvah, item.kwhExport, item.kvahExport]) {
        if (value == null) continue;
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });
  }

  validateRound5Precision(items: MonthlyNetMeterItem[]): void {
    items.forEach((item) => {
      for (const value of [
        item.kwh,
        item.kvah,
        item.kwhExport,
        item.kvahExport,
        item.netKwh,
        item.netKvah,
      ]) {
        if (value == null) continue;
        expect(hasAtMost5Decimals(value)).toBeTruthy();
      }
    });
  }

  validateNoNaN(items: MonthlyNetMeterItem[]): void {
    items.forEach((item) => {
      for (const value of [
        item.slNo,
        item.kwh,
        item.kvah,
        item.kwhExport,
        item.kvahExport,
        item.netKwh,
        item.netKvah,
      ]) {
        if (typeof value === "number") {
          expect(Number.isNaN(value)).toBeFalsy();
        }
      }
    });
  }

  validateBusinessRules(data: MonthlyNetMeterData): void {
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("limit");
    expect(data).toHaveProperty("totalPages");
  }
}
