// Validator/consumercategory.validator.ts

import { expect } from "@playwright/test";
import {ConsumerCategoryData,ConsumerCategoryResponse,} from "../Mapper/consumercategory.mapper";
export class ConsumerCategoryValidator {
  validateResponse(response: ConsumerCategoryResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: ConsumerCategoryData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: ConsumerCategoryData) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.shortName).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.shortName.trim()).not.toEqual("");
      expect(item.name.trim()).not.toEqual("");
    });
  }
  validateDuplicateIds(data: ConsumerCategoryData) {
    const ids = data.items.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  validateDuplicateNames(data: ConsumerCategoryData) {
    const names = data.items.map((x) => x.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  }
  validateDuplicateShortNames(data: ConsumerCategoryData) {
    const names = data.items.map((x) => x.shortName);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  }
  validateAscendingOrder(data: ConsumerCategoryData) {
    data.items.forEach((item, index) => {
      if (index > 0) {
        expect(item.id).toBeGreaterThan(data.items[index - 1].id);
      }
    });
  }
  validateExpectedCategories(data: ConsumerCategoryData) {
    const expected = ["Residential", "Commercial", "Agriculture"];
    const actual = data.items.map((x) => x.name);
    expected.forEach((value) => {
      expect(actual).toContain(value);
    });
  }
}
