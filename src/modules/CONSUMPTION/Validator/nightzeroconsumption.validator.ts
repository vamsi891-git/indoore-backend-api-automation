import { expect } from "@playwright/test";
import {
  NightZeroConsumptionData,
  NightZeroConsumptionItem,
} from "../Mapper/nightzeroconsumption.mapper";
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
  "tariff",
  "msn",
  "phase",
  "mf",
  "nightKwh",
  "dayKwh",
  "totalKwh",
  "eventCount",
  "durationMinutes",
] as const;

function round5(n: number): number {
  return Number(n.toFixed(5));
}

function hasAtMost5Decimals(n: number): boolean {
  return round5(n) === n;
}

export class NightZeroConsumptionValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateRootStructure(data: NightZeroConsumptionData): void {
    expect(Array.isArray(data.items)).toBeTruthy();
    expect(typeof data.total).toBe("number");
    expect(typeof data.page).toBe("number");
    expect(typeof data.limit).toBe("number");
    expect(typeof data.totalPages).toBe("number");
  }

  validateQueryEcho(
    data: NightZeroConsumptionData,
    page: number,
    limit: number,
  ): void {
    expect(data.page).toBe(page);
    expect(data.limit).toBe(limit);
  }

  validatePaginationBounds(data: NightZeroConsumptionData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.items.length).toBeLessThanOrEqual(data.limit);
  }

  /**
   * Backend may estimate `total` via limit+1 when exact COUNT is skipped;
   * still require `totalPages = ceil(total / limit)` on the returned meta.
   */
  validatePaginationMath(data: NightZeroConsumptionData): void {
    if (data.total === 0) {
      expect(data.items.length).toBe(0);
      expect(data.totalPages).toBe(0);
      return;
    }
    expect(data.totalPages).toBe(Math.ceil(data.total / data.limit));
    expect(data.total).toBeGreaterThanOrEqual(data.items.length);
  }

  validateItemsPresentWhenTotalPositive(data: NightZeroConsumptionData): void {
    if (data.total > 0 && data.page === 1) {
      expect(data.items.length).toBeGreaterThan(0);
    }
  }

  validateItemRequiredFields(items: NightZeroConsumptionItem[]): void {
    items.forEach((item) => {
      ITEM_REQUIRED_FIELDS.forEach((field) => {
        expect(item).toHaveProperty(field);
      });
    });
  }

  validateItemStructure(items: NightZeroConsumptionItem[]): void {
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
        "tariff",
        "msn",
        "phase",
      ] as const) {
        const value = item[field];
        expect(value === null || typeof value === "string").toBeTruthy();
      }
      expect(item.mf === null || typeof item.mf === "number").toBeTruthy();
      for (const field of [
        "nightKwh",
        "dayKwh",
        "totalKwh",
        "eventCount",
        "durationMinutes",
      ] as const) {
        const value = item[field];
        expect(value === null || typeof value === "number").toBeTruthy();
      }
    });
  }

  validateSerialSequence(
    items: NightZeroConsumptionItem[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    items.forEach((item, index) => {
      expect(item.slNo).toBe(base + index + 1);
    });
  }

  validateUniqueSerialNumbers(items: NightZeroConsumptionItem[]): void {
    validateUniqueConsumerKeys(items);
  }

  validateSharedHierarchyAllowed(items: NightZeroConsumptionItem[]): void {
    assertSharedHierarchyAllowed(items);
  }

  /** MDMS maps dayKwh to full-day total (same as totalKwh) when archive values exist. */
  validateDayEqualsTotalWhenPresent(items: NightZeroConsumptionItem[]): void {
    items.forEach((item) => {
      if (item.dayKwh != null && item.totalKwh != null) {
        expect(item.dayKwh).toBe(item.totalKwh);
      }
    });
  }

  validateNonNegativeMetrics(items: NightZeroConsumptionItem[]): void {
    items.forEach((item) => {
      for (const value of [
        item.nightKwh,
        item.dayKwh,
        item.totalKwh,
        item.eventCount,
        item.durationMinutes,
        item.mf,
      ]) {
        if (value == null) continue;
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });
  }

  validateRound5Precision(items: NightZeroConsumptionItem[]): void {
    items.forEach((item) => {
      for (const value of [item.nightKwh, item.dayKwh, item.totalKwh]) {
        if (value == null) continue;
        expect(hasAtMost5Decimals(value)).toBeTruthy();
      }
    });
  }

  validateNoNaN(items: NightZeroConsumptionItem[]): void {
    items.forEach((item) => {
      for (const value of [
        item.slNo,
        item.mf,
        item.nightKwh,
        item.dayKwh,
        item.totalKwh,
        item.eventCount,
        item.durationMinutes,
      ]) {
        if (typeof value === "number") {
          expect(Number.isNaN(value)).toBeFalsy();
        }
      }
    });
  }

  validateBusinessRules(data: NightZeroConsumptionData): void {
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("limit");
    expect(data).toHaveProperty("totalPages");
  }
}
