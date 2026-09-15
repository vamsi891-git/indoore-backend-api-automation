import { expect } from "@playwright/test";
import {
  backendRules,
  labelMappings,
} from "../Data/event-classification.data";
import {
  EventClassificationData,
  EventClassificationResponse,
} from "../Mapper/event-classification.mapper";

function addCalendarDay(ymd: string, delta: number): string {
  const [year, month, day] = ymd.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}

export class EventClassificationValidator {
  validateResponse(response: EventClassificationResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateReportType(
    data: EventClassificationData,
    expectedReportType?: string,
  ) {
    expect(backendRules.reportTypes).toContain(data.reportType);
    if (expectedReportType) {
      expect(data.reportType).toBe(expectedReportType);
    }
  }

  validateDates(data: EventClassificationData) {
    expect(data.currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.previousDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.previousDate).toBe(addCalendarDay(data.currentDate, -1));
  }

  validateTotals(data: EventClassificationData) {
    const currentTotal = data.classifications.reduce(
      (sum, item) => sum + item.currentDay,
      0,
    );
    const previousTotal = data.classifications.reduce(
      (sum, item) => sum + item.previousDay,
      0,
    );
    expect(currentTotal).toBe(data.totalEventsCurrentDay);
    expect(previousTotal).toBe(data.totalEventsPreviousDay);
    expect(data.totalEventsCurrentDay).toBeGreaterThanOrEqual(0);
    expect(data.totalEventsPreviousDay).toBeGreaterThanOrEqual(0);
  }

  validateClassifications(data: EventClassificationData) {
    expect(data.classifications.length).toBeGreaterThan(0);
    for (const item of data.classifications) {
      expect(item.category).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.currentDay).toBeGreaterThanOrEqual(0);
      expect(item.previousDay).toBeGreaterThanOrEqual(0);
    }
  }

  validateUniqueCategories(data: EventClassificationData) {
    const categories = data.classifications.map((item) => item.category);
    expect(new Set(categories).size).toBe(categories.length);
  }

  validateUniqueLabels(data: EventClassificationData) {
    const labels = data.classifications.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validateExpectedCategories(data: EventClassificationData) {
    expect(data.classifications.map((item) => item.category)).toEqual(
      backendRules.expectedCategories,
    );
  }

  validateLabelMappings(data: EventClassificationData) {
    for (const row of data.classifications) {
      expect(row.label).toBe(
        labelMappings[row.category as keyof typeof labelMappings],
      );
    }
  }

  validateSubsetDoesNotExceedAll(
    allMeters: EventClassificationData,
    subset: EventClassificationData,
  ) {
    const byCategory = new Map(
      allMeters.classifications.map((item) => [item.category, item]),
    );
    expect(subset.classifications.map((item) => item.category)).toEqual(
      allMeters.classifications.map((item) => item.category),
    );
    for (const item of subset.classifications) {
      const allItem = byCategory.get(item.category);
      expect(allItem).toBeDefined();
      expect(item.currentDay).toBeLessThanOrEqual(allItem!.currentDay);
      expect(item.previousDay).toBeLessThanOrEqual(allItem!.previousDay);
    }
  }
}
