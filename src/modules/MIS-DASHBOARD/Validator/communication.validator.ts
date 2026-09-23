import { expect } from "@playwright/test";
import {
  EXPECTED_COMMUNICATION_CATEGORIES,
  EXPECTED_COMMUNICATION_PHASES,
} from "../Data/communication.data";
import { CommStatsData, CommStatsResponse } from "../Mapper/communication.mapper";

function ymdDaysInclusive(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000) + 1;
}

function addCalendarDay(ymd: string, delta: number): string {
  const [year, month, day] = ymd.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}

export class CommStatsValidator {
  validateResponse(response: CommStatsResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateDates(data: CommStatsData) {
    expect(data.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.fromDate <= data.toDate).toBeTruthy();
  }

  validateWindow(
    data: CommStatsData,
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

  validateOverall(data: CommStatsData) {
    expect(data.overall.total).toBeGreaterThanOrEqual(0);
    expect(data.overall.communicating.count).toBeGreaterThanOrEqual(0);
    expect(data.overall.nonCommunicating.count).toBeGreaterThanOrEqual(0);
    expect(data.overall.communicating.count + data.overall.nonCommunicating.count).toBe(
      data.overall.total,
    );
    this.validateShare(
      data.overall.communicating.count,
      data.overall.total,
      data.overall.communicating.percentage,
    );
    this.validateShare(
      data.overall.nonCommunicating.count,
      data.overall.total,
      data.overall.nonCommunicating.percentage,
    );
  }

  validateCategories(data: CommStatsData) {
    expect(data.categories.length).toBeGreaterThan(0);
    for (const item of data.categories) {
      expect(item.label).toBeTruthy();
      expect(item.count).toBeGreaterThanOrEqual(0);
      this.validateShare(item.count, data.overall.communicating.count, item.percentage);
    }
  }

  validateExpectedCategoryLabels(data: CommStatsData) {
    expect(data.categories.map((item) => item.label).sort()).toEqual(
      [...EXPECTED_COMMUNICATION_CATEGORIES].sort(),
    );
  }

  validateUniqueCategoryLabels(data: CommStatsData) {
    const labels = data.categories.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validateCategoryCountsMatchCommunicating(data: CommStatsData) {
    const sum = data.categories.reduce((total, item) => total + item.count, 0);
    expect(sum).toBe(data.overall.communicating.count);
  }

  validatePhases(data: CommStatsData) {
    expect(data.phases.length).toBeGreaterThan(0);
    for (const item of data.phases) {
      expect(item.label).toBeTruthy();
      expect(item.count).toBeGreaterThanOrEqual(0);
      this.validateShare(item.count, data.overall.communicating.count, item.percentage);
    }
  }

  validateExpectedPhaseLabels(data: CommStatsData) {
    const labels = new Set(data.phases.map((item) => item.label));
    for (const want of EXPECTED_COMMUNICATION_PHASES) {
      expect(labels.has(want), `missing meter type: ${want}`).toBeTruthy();
    }
  }

  validateUniquePhaseLabels(data: CommStatsData) {
    const labels = data.phases.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validatePhaseCountsMatchCommunicating(data: CommStatsData) {
    const sum = data.phases.reduce((total, item) => total + item.count, 0);
    expect(sum).toBe(data.overall.communicating.count);
  }

  validateTrend(data: CommStatsData) {
    expect(data.communicationTrend.length).toBeGreaterThan(0);
    for (const item of data.communicationTrend) {
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.ipCount).toBeGreaterThanOrEqual(0);
      expect(item.dpCount).toBeGreaterThanOrEqual(0);
      expect(item.lsCount).toBeGreaterThanOrEqual(0);
    }
    this.validateUniqueTrendDates(data);
  }

  validateUniqueTrendDates(data: CommStatsData) {
    const dates = data.communicationTrend.map((item) => item.date);
    expect(new Set(dates).size).toBe(dates.length);
  }

  validateTrendMatchesWindow(data: CommStatsData) {
    const expectedDays = ymdDaysInclusive(data.fromDate, data.toDate);
    expect(data.communicationTrend.length).toBe(expectedDays);
    expect(data.communicationTrend[0]?.date).toBe(data.fromDate);
    expect(data.communicationTrend.at(-1)?.date).toBe(data.toDate);
    data.communicationTrend.forEach((point, index) => {
      expect(point.date).toBe(addCalendarDay(data.fromDate, index));
    });
  }

  private validateShare(count: number, total: number, percentage: string) {
    const actual = Number(percentage);
    expect(Number.isNaN(actual)).toBeFalsy();
    expect(actual).toBeGreaterThanOrEqual(0);
    expect(actual).toBeLessThanOrEqual(100);
    const expected = total === 0 ? 0 : (count / total) * 100;
    expect(actual).toBeCloseTo(expected, 1);
  }
}
