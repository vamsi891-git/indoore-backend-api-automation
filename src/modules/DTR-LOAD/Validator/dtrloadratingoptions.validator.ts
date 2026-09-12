import { expect } from "@playwright/test";
import type { DtrLoadRatingOptionsPayload } from "../Mapper/dtrloadratingoptions.mapper";

export class DtrLoadRatingOptionsValidator {
  validateItemsPresent(data: DtrLoadRatingOptionsPayload): void {
    expect(data.items.length).toBeGreaterThan(0);
  }

  validateFields(data: DtrLoadRatingOptionsPayload): void {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.value.trim()).not.toEqual("");
      const numeric = Number(item.value);
      expect(Number.isFinite(numeric)).toBe(true);
      expect(numeric).toBeGreaterThan(0);
      expect(item.id).toBe(numeric);
    });
  }

  validateUniqueIds(data: DtrLoadRatingOptionsPayload): void {
    const ids = data.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateUniqueValues(data: DtrLoadRatingOptionsPayload): void {
    const values = data.items.map((item) => item.value);
    expect(new Set(values).size).toBe(values.length);
  }

  validateAscendingOrder(data: DtrLoadRatingOptionsPayload): void {
    data.items.forEach((item, index) => {
      if (index > 0) {
        expect(item.id).toBeGreaterThan(data.items[index - 1].id);
      }
    });
  }
}
