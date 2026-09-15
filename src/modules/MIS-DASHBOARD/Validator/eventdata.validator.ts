import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventdata.data";
import { EventDataSummary } from "../Mapper/eventdata.mapper";

function addOneDay(isoDate: string): string {
  const next = new Date(`${isoDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export class EventDataValidator {
  validateResponse(response: { success: boolean; data: unknown }) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateDates(data: EventDataSummary) {
    expect(data.currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.previousDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(addOneDay(data.previousDate)).toBe(data.currentDate);
  }

  validateClassificationShape(data: EventDataSummary, expectedReportType?: string) {
    expect(backendRules.reportTypes).toContain(data.reportType);
    if (expectedReportType) {
      expect(data.reportType).toBe(expectedReportType);
    }
    expect(data.classifications.map((row) => row.category)).toEqual(
      backendRules.expectedCategories,
    );
    expect(data.priorities.length).toBe(0);
    const currentTotal = data.classifications.reduce(
      (sum, row) => sum + row.currentDay,
      0,
    );
    const previousTotal = data.classifications.reduce(
      (sum, row) => sum + row.previousDay,
      0,
    );
    expect(currentTotal).toBe(data.totalEventsCurrentDay);
    expect(previousTotal).toBe(data.totalEventsPreviousDay);
    for (const row of data.classifications) {
      expect(row.currentDay).toBeGreaterThanOrEqual(0);
      expect(row.previousDay).toBeGreaterThanOrEqual(0);
      expect(row.label).toBe(
        backendRules.labelMappings[
          row.category as keyof typeof backendRules.labelMappings
        ],
      );
    }
    const categories = data.classifications.map((row) => row.category);
    expect(new Set(categories).size).toBe(categories.length);
    const labels = data.classifications.map((row) => row.label);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validatePriorityShape(data: EventDataSummary) {
    expect(data.reportType).toBe("");
    expect(data.classifications.length).toBe(0);
    expect(data.priorities.map((row) => row.priorityId)).toEqual(
      backendRules.priorityIds,
    );
    expect(data.active.currentDay + data.resolve.currentDay).toBe(
      data.totalEventsCurrentDay,
    );
    expect(data.active.previousDay + data.resolve.previousDay).toBe(
      data.totalEventsPreviousDay,
    );
    const currentTotal = data.priorities.reduce(
      (sum, row) => sum + row.currentDay,
      0,
    );
    const previousTotal = data.priorities.reduce(
      (sum, row) => sum + row.previousDay,
      0,
    );
    expect(currentTotal).toBe(data.totalEventsCurrentDay);
    expect(previousTotal).toBe(data.totalEventsPreviousDay);
    for (const row of data.priorities) {
      expect(row.currentDay).toBeGreaterThanOrEqual(0);
      expect(row.previousDay).toBeGreaterThanOrEqual(0);
      expect(row.label).toBe(`Priority ${row.priorityId}`);
    }
    const ids = data.priorities.map((row) => row.priorityId);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateUniqueClassificationCategories(data: EventDataSummary) {
    const categories = data.classifications.map((row) => row.category);
    expect(new Set(categories).size).toBe(categories.length);
  }

  validateUniquePriorityIds(data: EventDataSummary) {
    const ids = data.priorities.map((row) => row.priorityId);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateSubsetDoesNotExceedAll(
    allMeters: EventDataSummary,
    subset: EventDataSummary,
  ) {
    expect(subset.totalEventsCurrentDay).toBeLessThanOrEqual(
      allMeters.totalEventsCurrentDay,
    );
    expect(subset.totalEventsPreviousDay).toBeLessThanOrEqual(
      allMeters.totalEventsPreviousDay,
    );
    if (allMeters.classifications.length > 0) {
      const byCategory = new Map(
        allMeters.classifications.map((row) => [row.category, row]),
      );
      expect(subset.classifications.map((row) => row.category)).toEqual(
        allMeters.classifications.map((row) => row.category),
      );
      for (const row of subset.classifications) {
        const allRow = byCategory.get(row.category);
        expect(allRow).toBeDefined();
        expect(row.currentDay).toBeLessThanOrEqual(allRow!.currentDay);
        expect(row.previousDay).toBeLessThanOrEqual(allRow!.previousDay);
      }
      return;
    }
    const byId = new Map(
      allMeters.priorities.map((row) => [row.priorityId, row]),
    );
    expect(subset.priorities.map((row) => row.priorityId)).toEqual(
      allMeters.priorities.map((row) => row.priorityId),
    );
    for (const row of subset.priorities) {
      const allRow = byId.get(row.priorityId);
      expect(allRow).toBeDefined();
      expect(row.currentDay).toBeLessThanOrEqual(allRow!.currentDay);
      expect(row.previousDay).toBeLessThanOrEqual(allRow!.previousDay);
    }
  }

  validate(data: EventDataSummary, expectedReportType?: string) {
    this.validateDates(data);
    expect(data.totalEventsCurrentDay).toBeGreaterThanOrEqual(0);
    expect(data.totalEventsPreviousDay).toBeGreaterThanOrEqual(0);
    if (expectedReportType === "priority-wise") {
      this.validatePriorityShape(data);
      return;
    }
    this.validateClassificationShape(data, expectedReportType);
  }
}
