import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventpriorityoverview.data";
import { EventPriorityOverviewData } from "../Mapper/eventpriorityoverview.mapper";

function addOneDay(isoDate: string): string {
  const next = new Date(`${isoDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export class EventPriorityOverviewValidator {
  validateResponse(response: { success: boolean; data: unknown }) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateDates(data: EventPriorityOverviewData) {
    expect(data.currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.previousDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(addOneDay(data.previousDate)).toBe(data.currentDate);
  }

  validateNonNegative(data: EventPriorityOverviewData) {
    expect(data.totalEventsCurrentDay).toBeGreaterThanOrEqual(0);
    expect(data.totalEventsPreviousDay).toBeGreaterThanOrEqual(0);
    expect(data.active.currentDay).toBeGreaterThanOrEqual(0);
    expect(data.active.previousDay).toBeGreaterThanOrEqual(0);
    expect(data.resolve.currentDay).toBeGreaterThanOrEqual(0);
    expect(data.resolve.previousDay).toBeGreaterThanOrEqual(0);
    for (const row of data.priorities) {
      expect(row.currentDay).toBeGreaterThanOrEqual(0);
      expect(row.previousDay).toBeGreaterThanOrEqual(0);
    }
  }

  validateStatusTotals(data: EventPriorityOverviewData) {
    expect(data.active.currentDay + data.resolve.currentDay).toBe(
      data.totalEventsCurrentDay,
    );
    expect(data.active.previousDay + data.resolve.previousDay).toBe(
      data.totalEventsPreviousDay,
    );
  }

  validatePriorityCount(data: EventPriorityOverviewData) {
    expect(data.priorities.length).toBe(backendRules.priorityCount);
  }

  validatePriorityIds(data: EventPriorityOverviewData) {
    expect(data.priorities.map((row) => row.priorityId)).toEqual(
      backendRules.priorityIds,
    );
  }

  validateLabels(data: EventPriorityOverviewData) {
    for (const row of data.priorities) {
      expect(row.label).toBe(`Priority ${row.priorityId}`);
    }
  }

  validateUniquePriorityIds(data: EventPriorityOverviewData) {
    const ids = data.priorities.map((row) => row.priorityId);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateUniquePriorityLabels(data: EventPriorityOverviewData) {
    const labels = data.priorities.map((row) => row.label);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validateDuplicatePriority(data: EventPriorityOverviewData) {
    this.validateUniquePriorityIds(data);
  }

  validateCurrentTotals(data: EventPriorityOverviewData) {
    const total = data.priorities.reduce((sum, row) => sum + row.currentDay, 0);
    expect(total).toBe(data.totalEventsCurrentDay);
  }

  validatePreviousTotals(data: EventPriorityOverviewData) {
    const total = data.priorities.reduce((sum, row) => sum + row.previousDay, 0);
    expect(total).toBe(data.totalEventsPreviousDay);
  }

  validateSubsetDoesNotExceedAll(
    allMeters: EventPriorityOverviewData,
    subset: EventPriorityOverviewData,
  ) {
    expect(subset.totalEventsCurrentDay).toBeLessThanOrEqual(
      allMeters.totalEventsCurrentDay,
    );
    expect(subset.totalEventsPreviousDay).toBeLessThanOrEqual(
      allMeters.totalEventsPreviousDay,
    );
    expect(subset.priorities.map((row) => row.priorityId)).toEqual(
      allMeters.priorities.map((row) => row.priorityId),
    );
    const byId = new Map(
      allMeters.priorities.map((row) => [row.priorityId, row]),
    );
    for (const row of subset.priorities) {
      const allRow = byId.get(row.priorityId);
      expect(allRow).toBeDefined();
      expect(row.currentDay).toBeLessThanOrEqual(allRow!.currentDay);
      expect(row.previousDay).toBeLessThanOrEqual(allRow!.previousDay);
    }
  }

  validate(data: EventPriorityOverviewData) {
    this.validateDates(data);
    this.validateNonNegative(data);
    this.validateStatusTotals(data);
    this.validatePriorityCount(data);
    this.validatePriorityIds(data);
    this.validateLabels(data);
    this.validateUniquePriorityIds(data);
    this.validateUniquePriorityLabels(data);
    this.validateCurrentTotals(data);
    this.validatePreviousTotals(data);
  }
}
