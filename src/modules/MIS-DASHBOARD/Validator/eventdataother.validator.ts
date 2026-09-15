import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventdataother.data";
import { EventOtherData } from "../Mapper/eventdataother.mapper";

type TrendPeriod = keyof typeof backendRules.trendRegex;

export class EventOtherValidator {
  validateResponse(response: { success: boolean; data: unknown }) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }
  validateReportType(data: EventOtherData, expected?: string) {
    expect(backendRules.reportTypes).toContain(data.reportType);
    if (expected) {
      expect(data.reportType).toBe(expected);
    }
  }
  validatePeriod(data: EventOtherData, expected?: string) {
    expect(backendRules.periods).toContain(data.period);
    if (expected) {
      expect(data.period).toBe(expected);
    }
  }
  validateCategory(data: EventOtherData) {
    expect(data.category).toBe("other");
    expect(data.label).toBe("Others");
  }
  validateDates(data: EventOtherData) {
    expect(data.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.fromDate <= data.toDate).toBeTruthy();
    if (data.period === "hourly") {
      expect(data.fromDate).toBe(data.toDate);
    }
  }
  validateNotEmpty(data: EventOtherData) {
    expect(data.records.length).toBeGreaterThan(0);
    expect(data.trend.length).toBeGreaterThan(0);
  }
  validateTotals(data: EventOtherData) {
    const total = data.records.reduce((sum, item) => sum + item.count, 0);
    expect(total).toBe(data.totalCount);
  }
  validateUniqueRecordLabels(data: EventOtherData) {
    const labels = data.records.map((row) => row.label);
    expect(new Set(labels).size).toBe(labels.length);
  }
  validateUniqueTrendSeriesNames(data: EventOtherData) {
    const names = data.trend.map((series) => series.name);
    expect(new Set(names).size).toBe(names.length);
  }
  validateUniqueTrendPointKeys(data: EventOtherData) {
    for (const series of data.trend) {
      const keys = series.data.map((point) => point.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  }
  validateStructure(data: EventOtherData) {
    const labels: string[] = [];
    for (const row of data.records) {
      expect(row.label).toBeTruthy();
      expect(row.count).toBeGreaterThanOrEqual(0);
      expect(Number(row.percentage)).not.toBeNaN();
      labels.push(row.label);
    }
    this.validateUniqueRecordLabels(data);
    if (data.reportType === "phase-wise") {
      expect(labels).toEqual(backendRules.phaseLabels);
    } else {
      for (const label of labels) {
        expect(backendRules.categoryLabels).toContain(label);
      }
    }
  }
  validatePercentages(data: EventOtherData) {
    for (const row of data.records) {
      const expected =
        data.totalCount === 0 ? 0 : (row.count / data.totalCount) * 100;
      expect(Number(row.percentage)).toBeCloseTo(expected, 2);
    }
  }
  validateTrend(data: EventOtherData) {
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
  validateTrendSeriesNames(data: EventOtherData) {
    const names = data.records.map((x) => x.label);
    const trendNames = data.trend.map((x) => x.name);
    expect(trendNames).toEqual(names);
  }
  validateTrendAggregation(data: EventOtherData) {
    for (const series of data.trend) {
      const trendTotal = series.data.reduce((sum, item) => sum + item.value, 0);
      const record = data.records.find((x) => x.label === series.name);
      expect(trendTotal).toBe(record?.count);
    }
  }
  validateTrendPointCounts(data: EventOtherData) {
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
    allMeters: EventOtherData,
    subset: EventOtherData,
  ) {
    expect(subset.totalCount).toBeLessThanOrEqual(allMeters.totalCount);
  }

  validate(
    data: EventOtherData,
    expected?: { reportType?: string; period?: string },
  ) {
    this.validateReportType(data, expected?.reportType);
    this.validatePeriod(data, expected?.period);
    this.validateCategory(data);
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
