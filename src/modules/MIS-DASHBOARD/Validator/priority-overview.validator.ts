import { expect } from "@playwright/test";
import { PriorityOverviewData, PriorityOverviewResponse } from "../Mapper/priority-overview.mapper";

export class PriorityOverviewValidator {
  validateResponse(response: PriorityOverviewResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateDates(data: PriorityOverviewData) {
    expect(data.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.fromDate <= data.toDate).toBeTruthy();
  }

  validateWindow(
    data: PriorityOverviewData,
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

  validatePrioritiesExist(data: PriorityOverviewData) {
    expect(data.priorities.length).toBeGreaterThan(0);
  }

  validatePriorityStructure(data: PriorityOverviewData) {
    for (const item of data.priorities) {
      expect(item.priorityId).toBeGreaterThanOrEqual(0);
      expect(item.priorityLabel).toBe(`P${item.priorityId}`);
      expect(item.events).toBeGreaterThanOrEqual(0);
      expect(item.alarms).toBeGreaterThanOrEqual(0);
    }
  }

  validateUniquePriorityIds(data: PriorityOverviewData) {
    const ids = data.priorities.map((item) => item.priorityId);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateUniquePriorityLabels(data: PriorityOverviewData) {
    const labels = data.priorities.map((item) => item.priorityLabel);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validatePriorityOrdering(data: PriorityOverviewData) {
    for (let i = 1; i < data.priorities.length; i++) {
      expect(data.priorities[i].priorityId).toBeGreaterThan(data.priorities[i - 1].priorityId);
    }
  }

  validateSubsetDoesNotExceedAll(allMeters: PriorityOverviewData, subset: PriorityOverviewData) {
    const byId = new Map(allMeters.priorities.map((item) => [item.priorityId, item]));
    expect(subset.priorities.map((item) => item.priorityId)).toEqual(
      allMeters.priorities.map((item) => item.priorityId),
    );
    for (const item of subset.priorities) {
      const allItem = byId.get(item.priorityId);
      expect(allItem).toBeDefined();
      expect(item.events).toBeLessThanOrEqual(allItem!.events);
      expect(item.alarms).toBeLessThanOrEqual(allItem!.alarms);
    }
  }
}
