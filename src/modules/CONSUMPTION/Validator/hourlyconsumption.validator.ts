import { expect } from "@playwright/test";
import {HourlyConsumptionData,HourlyConsumptionItem,} from "../Mapper/hourlyconsumption.mapper";
const HOUR_FIELDS = Array.from({ length: 24 }, (_, index) => `h${index + 1}`);
const ITEM_REQUIRED_FIELDS = [
  "slNo",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "name",
  "ivrsNumber",
  "msn",
  "phase",
  "hourlyKwh",
  ...HOUR_FIELDS,
] as const;
export class HourlyConsumptionValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }
  validateRootStructure(data: HourlyConsumptionData): void {
    expect(Array.isArray(data.items)).toBeTruthy();
    expect(typeof data.total).toBe("number");
    expect(typeof data.page).toBe("number");
    expect(typeof data.limit).toBe("number");
    expect(typeof data.totalPages).toBe("number");
  }
  validateQueryEcho(data: HourlyConsumptionData, page: number, limit: number): void {
    expect(data.page).toBe(page);
    expect(data.limit).toBe(limit);
  }
  validatePaginationBounds(data: HourlyConsumptionData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.items.length).toBeLessThanOrEqual(data.limit);
  }
  validatePaginationMath(data: HourlyConsumptionData): void {
    if (data.total === 0) {
      expect(data.items.length).toBe(0);
      expect(data.totalPages).toBe(0);
      return;
    }
    expect(data.totalPages).toBe(Math.ceil(data.total / data.limit));
    expect(data.total).toBeGreaterThanOrEqual(data.items.length);
  }
  validateItemRequiredFields(items: HourlyConsumptionItem[]): void {
    items.forEach((item) => {
      ITEM_REQUIRED_FIELDS.forEach((field) => {
        expect(item).toHaveProperty(field);
      });
    });
  }
  validateSerialSequence(items: HourlyConsumptionItem[],page: number,limit: number,): void {
    const base = (page - 1) * limit;
    items.forEach((item, index) => {
      expect(item.slNo).toBe(base + index + 1);
    });
  }
  validateHourBuckets(items: HourlyConsumptionItem[]): void {
    items.forEach((item) => {
      HOUR_FIELDS.forEach((field) => {
        const value = item[field as keyof HourlyConsumptionItem];
        if (value !== null) {
          expect(typeof value).toBe("number");
          expect(value).toBeGreaterThanOrEqual(0);
        }
      });
    });
  }
  validateHourlyTotalBundle(items: HourlyConsumptionItem[]): void {
    items.forEach((item) => {
      const hours = HOUR_FIELDS.map(
        (field) => item[field as keyof HourlyConsumptionItem] as number | null,
      );
      const allNull = hours.every((value) => value === null);
      if (allNull) {
        expect(item.hourlyKwh).toBeNull();
        return;
      }
      if (item.hourlyKwh !== null) {
        expect(item.hourlyKwh).toBeGreaterThanOrEqual(0);
      }
    });
  }
  validateNoNaN(items: HourlyConsumptionItem[]): void {
    items.forEach((item) => {
      for (const field of [...HOUR_FIELDS, "hourlyKwh", "slNo"]) {
        const value = item[field as keyof HourlyConsumptionItem];
        if (typeof value === "number") {
          expect(Number.isNaN(value)).toBeFalsy();
        }
      }
    });
  }
}
