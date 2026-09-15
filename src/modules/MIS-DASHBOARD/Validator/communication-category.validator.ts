import { expect } from "@playwright/test";
import { EXPECTED_COMMUNICATION_CATEGORY_LABELS } from "../Data/communication-category.data";
import {
  CommunicationCategoryData,
  CommunicationCategoryResponse,
} from "../Mapper/communication-category.mapper";

export class CommunicationCategoryValidator {
  validateResponse(response: CommunicationCategoryResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateDates(data: CommunicationCategoryData) {
    expect(data.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.fromDate <= data.toDate).toBeTruthy();
  }

  validateWindow(
    data: CommunicationCategoryData,
    expectedFromDate?: string,
    expectedToDate?: string,
    expectSameDayWindow?: boolean,
  ) {
    this.validateDates(data);
    if (expectedFromDate) {
      expect(data.fromDate).toBe(expectedFromDate);
    }
    if (expectedToDate) {
      expect(data.toDate).toBe(expectedToDate);
    }
    if (expectSameDayWindow) {
      expect(data.fromDate).toBe(data.toDate);
    }
  }

  validateCategories(data: CommunicationCategoryData) {
    expect(data.categories.length).toBeGreaterThan(0);
    for (const item of data.categories) {
      expect(item.label).toBeTruthy();
      expect(item.count).toBeGreaterThanOrEqual(0);
      const actual = Number(item.percentage);
      expect(Number.isNaN(actual)).toBeFalsy();
      expect(actual).toBeGreaterThanOrEqual(0);
      expect(actual).toBeLessThanOrEqual(100);
      if (item.count === 0) {
        expect(actual).toBe(0);
      }
    }
  }

  validateExpectedCategoryLabels(data: CommunicationCategoryData) {
    expect(data.categories.map((item) => item.label).sort()).toEqual(
      [...EXPECTED_COMMUNICATION_CATEGORY_LABELS].sort(),
    );
  }

  validateUniqueCategoryLabels(data: CommunicationCategoryData) {
    const labels = data.categories.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validateZeroCounts(data: CommunicationCategoryData) {
    for (const item of data.categories) {
      expect(item.count).toBe(0);
      expect(Number(item.percentage)).toBe(0);
    }
  }

  validateSubsetDoesNotExceedAll(
    allMeters: CommunicationCategoryData,
    subset: CommunicationCategoryData,
  ) {
    const byLabel = new Map(
      allMeters.categories.map((item) => [item.label, item.count]),
    );
    expect(subset.categories.map((item) => item.label).sort()).toEqual(
      allMeters.categories.map((item) => item.label).sort(),
    );
    for (const item of subset.categories) {
      expect(item.count).toBeLessThanOrEqual(byLabel.get(item.label) ?? 0);
    }
  }
}
