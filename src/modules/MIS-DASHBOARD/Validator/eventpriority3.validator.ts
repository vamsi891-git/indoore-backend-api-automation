import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventpriority3.data";
import { EventPriorityData } from "../Mapper/eventpriority3.mapper";

type TrendPeriod = keyof typeof backendRules.trendRegex;

export class EventPriorityValidator {
  validateResponse(response: { success: boolean; data: unknown }) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }
  validatePeriod(data: EventPriorityData, expected?: string) {
    expect(backendRules.periods).toContain(data.period);
    if (expected) {
      expect(data.period).toBe(expected);
    }
  }
  validatePriority(
    data: EventPriorityData,
    expected?: { priorityId?: number; label?: string },
  ) {
    expect(data.priorityId).toBeGreaterThan(0);
    expect(data.label).toBeTruthy();
    if (expected?.priorityId !== undefined) {
      expect(data.priorityId).toBe(expected.priorityId);
    }
    if (expected?.label) {
      expect(data.label).toBe(expected.label);
    }
  }
  validateDates(data: EventPriorityData) {
    expect(data.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.fromDate <= data.toDate).toBeTruthy();
    if (data.period === "hourly") {
      expect(data.fromDate).toBe(data.toDate);
    }
  }
  validateNotEmpty(data: EventPriorityData) {
    expect(data.records.length).toBeGreaterThan(0);
    expect(data.trend.length).toBeGreaterThan(0);
  }
  validateTotals(data: EventPriorityData) {
    const total = data.records.reduce((sum, item) => sum + item.count, 0);
    expect(total).toBe(data.totalCount);
  }
  validateUniqueRecordLabels(data: EventPriorityData) {
    const labels = data.records.map((row) => row.label);
    expect(new Set(labels).size).toBe(labels.length);
  }
  validateUniqueTrendSeriesNames(data: EventPriorityData) {
    const names = data.trend.map((series) => series.name);
    expect(new Set(names).size).toBe(names.length);
  }
  validateUniqueTrendPointKeys(data: EventPriorityData) {
    for (const series of data.trend) {
      const keys = series.data.map((point) => point.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  }
  validateStructure(data: EventPriorityData) {
    for (const row of data.records) {
      expect(row.label).toBeTruthy();
      expect(row.count).toBeGreaterThanOrEqual(0);
      expect(Number(row.percentage)).not.toBeNaN();
    }
    this.validateUniqueRecordLabels(data);
    expect(data.records.map((row) => row.label)).toEqual(backendRules.phaseLabels);
  }
  validatePercentages(data: EventPriorityData) {
    for (const row of data.records) {
      const expected =
        data.totalCount === 0 ? 0 : (row.count / data.totalCount) * 100;
      expect(Number(row.percentage)).toBeCloseTo(expected, 2);
    }
  }
  validateTrend(data: EventPriorityData) {
    const regex = backendRules.trendRegex[data.period as TrendPeriod];
    expect(regex).toBeDefined();
    expect(data.trend.length).toBe(data.records.length);
    for (const series of data.trend) {
      expect(series.name).toBeTruthy();
      series.data.forEach((point) => {
        expect(point.key).toMatch(regex);
        expect(point.label).toBeTruthy();
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.meterCount).toBeGreaterThanOrEqual(0);
      });
    }
  }
  validateTrendSeriesNames(data: EventPriorityData) {
    expect(data.trend.map((series) => series.name)).toEqual(
      data.records.map((row) => row.label),
    );
  }
  validateTrendAggregation(data: EventPriorityData) {
    for (const series of data.trend) {
      const trendTotal = series.data.reduce((sum, item) => sum + item.value, 0);
      const record = data.records.find((row) => row.label === series.name);
      expect(trendTotal).toBe(record?.count);
    }
  }
  validateTrendPointCounts(data: EventPriorityData) {
    const from = Date.parse(`${data.fromDate}T00:00:00Z`);
    const to = Date.parse(`${data.toDate}T00:00:00Z`);
    const dailyDays = Math.round((to - from) / 86_400_000) + 1;
    const [fromYear, fromMonth] = data.fromDate.split("-").map(Number);
    const [toYear, toMonth] = data.toDate.split("-").map(Number);
    const monthlyMonths = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
    const expectedCounts: Record<string, number> = {
      hourly: 24,
      daily: dailyDays,
      weekly: 4,
      monthly: monthlyMonths,
    };
    const expected = expectedCounts[data.period];
    if (!expected) return;
    for (const series of data.trend) {
      expect(series.data.length).toBe(expected);
    }
  }
  validateSubsetDoesNotExceedAll(
    allMeters: EventPriorityData,
    subset: EventPriorityData,
  ) {
    expect(subset.totalCount).toBeLessThanOrEqual(allMeters.totalCount);
  }
  validate(
    data: EventPriorityData,
    expected?: { period?: string; priorityId?: number; label?: string },
  ) {
    this.validatePeriod(data, expected?.period);
    this.validatePriority(data, expected);
    this.validateDates(data);
    this.validateNotEmpty(data);
    this.validateTotals(data);
    this.validateStructure(data);
    this.validatePercentages(data);
    this.validateTrend(data);
    this.validateUniqueTrendSeriesNames(data);
    this.validateUniqueTrendPointKeys(data);
    this.validateTrendSeriesNames(data);
    this.validateTrendAggregation(data);
    this.validateTrendPointCounts(data);
  }
}
