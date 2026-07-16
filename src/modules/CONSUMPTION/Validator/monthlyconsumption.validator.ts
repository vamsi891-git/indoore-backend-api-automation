import { expect } from "@playwright/test";
import {
  MonthlyReportConsumptionData,
  MonthlyReportConsumptionItem,
} from "../Mapper/monthlyconsumption.mapper";

const ITEM_REQUIRED_FIELDS = [
  "slNo",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "name",
  "address",
  "ivrsNumber",
  "tariff",
  "msn",
  "phase",
  "kwh",
  "kvah",
  "mdKw",
  "mdKvah",
] as const;

export class MonthlyReportConsumptionValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateRootStructure(data: MonthlyReportConsumptionData): void {
    expect(Array.isArray(data.items)).toBeTruthy();
    expect(typeof data.total).toBe("number");
    expect(typeof data.page).toBe("number");
    expect(typeof data.limit).toBe("number");
    expect(typeof data.totalPages).toBe("number");
  }

  validateQueryEcho(
    data: MonthlyReportConsumptionData,
    page: number,
    limit: number,
  ): void {
    expect(data.page).toBe(page);
    expect(data.limit).toBe(limit);
  }

  validatePaginationBounds(data: MonthlyReportConsumptionData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.items.length).toBeLessThanOrEqual(data.limit);
  }

  validatePaginationMath(data: MonthlyReportConsumptionData): void {
    if (data.total === 0) {
      expect(data.items.length).toBe(0);
      expect(data.totalPages).toBe(0);
      return;
    }
    expect(data.totalPages).toBe(Math.ceil(data.total / data.limit));
    expect(data.total).toBeGreaterThanOrEqual(data.items.length);
  }

  validateItemRequiredFields(items: MonthlyReportConsumptionItem[]): void {
    items.forEach((item) => {
      ITEM_REQUIRED_FIELDS.forEach((field) => {
        expect(item).toHaveProperty(field);
      });
    });
  }

  validateSerialSequence(
    items: MonthlyReportConsumptionItem[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    items.forEach((item, index) => {
      expect(item.slNo).toBe(base + index + 1);
    });
  }

  validateEnergyFields(items: MonthlyReportConsumptionItem[]): void {
    items.forEach((item) => {
      for (const field of ["kwh", "kvah", "mdKw", "mdKvah"] as const) {
        const value = item[field];
        if (value !== null) {
          expect(typeof value).toBe("number");
          expect(value).toBeGreaterThanOrEqual(0);
        }
      }
    });
  }

  validateNullEnergyBundle(items: MonthlyReportConsumptionItem[]): void {
    items.forEach((item) => {
      if (
        item.kwh === null &&
        item.kvah === null &&
        item.mdKw === null &&
        item.mdKvah === null
      ) {
        return;
      }
      expect(item.kwh === null || typeof item.kwh === "number").toBeTruthy();
    });
  }

  validateNoNaN(items: MonthlyReportConsumptionItem[]): void {
    items.forEach((item) => {
      for (const value of [item.kwh, item.kvah, item.mdKw, item.mdKvah, item.slNo]) {
        if (typeof value === "number") {
          expect(Number.isNaN(value)).toBeFalsy();
        }
      }
    });
  }
}
