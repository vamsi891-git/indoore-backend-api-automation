import { expect } from "@playwright/test";

import {
  addMonths,
  formatDpPeriodLabel,
  isDailyTrendData,
  isHourlyTrendData,
  isMonthlyTrendData,
  mapNetworkTrendData,
  monthYearKey,
  NETWORK_TREND_DAILY_PERIOD_COUNT,
  NETWORK_TREND_HOUR_KEYS,
  NETWORK_TREND_HOURLY_PERIOD_COUNT,
  NetworkTrendData,
  NetworkTrendDailyItem,
  NetworkTrendHourlyItem,
  NetworkTrendMonthlyItem,
  NetworkTrendQuery,
  NetworkTrendReportType,
  NetworkTrendResponse,
  parseIsoDate,
} from "../Mapper/network-trends.mapper";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DP_PERIOD_LABEL_RE = /^\d{2}-\d{2}-\d{4}$/;
const HOUR_TIME_RE = /^([01]\d|2[0-3]):00$/;

const BILLING_MONTH_ABBREVS: Record<number, string[]> = {
  1: ["Jan", "January"],
  2: ["Feb", "February"],
  3: ["Mar", "March"],
  4: ["Apr", "April"],
  5: ["May"],
  6: ["Jun", "June"],
  7: ["Jul", "July"],
  8: ["Aug", "August"],
  9: ["Sep", "Sept", "September"],
  10: ["Oct", "October"],
  11: ["Nov", "November"],
  12: ["Dec", "December"],
};

function expectedHourTime(hourIndex: number): string {
  return `${String(hourIndex).padStart(2, "0")}:00`;
}

export class NetworkTrendsValidator {
  validateResponse(response: NetworkTrendResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.items)).toBe(true);
  }

  validateReportTypeEcho(
    data: NetworkTrendData,
    query: NetworkTrendQuery,
  ): void {
    expect(data.reportType).toBe(query["report-type"]);
  }

  validateAnchorFields(
    data: NetworkTrendData,
    reportType: NetworkTrendReportType,
  ): void {
    if (reportType === "billing") {
      expect(data.anchorDate, "billing anchorDate must be null").toBeNull();
      expect(data.anchorMonth, "billing anchorMonth must be set").not.toBeNull();
      expect(data.anchorYear, "billing anchorYear must be set").not.toBeNull();
      expect(data.anchorMonth!).toBeGreaterThanOrEqual(1);
      expect(data.anchorMonth!).toBeLessThanOrEqual(12);
      expect(data.anchorYear!).toBeGreaterThanOrEqual(2000);
      expect(data.anchorYear!).toBeLessThanOrEqual(2100);
      return;
    }

    if (reportType === "dp" || reportType === "ls") {
      expect(
        data.anchorMonth,
        `${reportType} anchorMonth must be null`,
      ).toBeNull();
      expect(
        data.anchorYear,
        `${reportType} anchorYear must be null`,
      ).toBeNull();
      expect(
        data.anchorDate,
        `${reportType} anchorDate must be set`,
      ).not.toBeNull();
      expect(data.anchorDate!).toMatch(ISO_DATE_RE);
    }
  }

  validateItemCount(data: NetworkTrendData): void {
    if (isMonthlyTrendData(data) || isDailyTrendData(data)) {
      expect(data.items.length).toBe(NETWORK_TREND_DAILY_PERIOD_COUNT);
      return;
    }

    expect(data.items.length).toBe(NETWORK_TREND_HOURLY_PERIOD_COUNT);
  }

  validateBillingItemNullRules(items: NetworkTrendMonthlyItem[]): void {
    for (const [index, item] of items.entries()) {
      expect(item.date, `items[${index}].date must be null for billing`).toBeNull();
      expect(item.month, `items[${index}].month must be set for billing`).not.toBeNull();
      expect(item.year, `items[${index}].year must be set for billing`).not.toBeNull();
      expect(item.month!).toBeGreaterThanOrEqual(1);
      expect(item.month!).toBeLessThanOrEqual(12);
      expect(item.year!).toBeGreaterThanOrEqual(2000);
      expect(item.year!).toBeLessThanOrEqual(2100);
    }
  }

  validateDpItemNullRules(items: NetworkTrendDailyItem[]): void {
    for (const [index, item] of items.entries()) {
      expect(item.date, `items[${index}].date must be set for dp`).not.toBeNull();
      expect(item.date!).toMatch(ISO_DATE_RE);
      expect(item.month, `items[${index}].month must be null for dp`).toBeNull();
      expect(item.year, `items[${index}].year must be null for dp`).toBeNull();
    }
  }

  validateLsItemShape(items: NetworkTrendHourlyItem[]): void {
    for (const [index, item] of items.entries()) {
      expect(item.hour.trim().length, `items[${index}].hour`).toBeGreaterThan(0);
      expect(item.time.trim().length, `items[${index}].time`).toBeGreaterThan(0);
      expect(item.hour).toMatch(/^H([1-9]|1\d|2[0-4])$/);
      expect(item.time).toMatch(HOUR_TIME_RE);
    }
  }

  validateItemNullRules(data: NetworkTrendData): void {
    if (isMonthlyTrendData(data)) {
      this.validateBillingItemNullRules(data.items);
      return;
    }

    if (isDailyTrendData(data)) {
      this.validateDpItemNullRules(data.items);
      return;
    }

    this.validateLsItemShape(data.items);
  }

  validateBillingPeriodLabels(items: NetworkTrendMonthlyItem[]): void {
    for (const [index, item] of items.entries()) {
      expect(item.periodLabel.trim().length, `items[${index}].periodLabel`).toBeGreaterThan(0);
      expect(item.periodLabel).toContain(String(item.year));

      const abbrevs = BILLING_MONTH_ABBREVS[item.month] ?? [];
      const hasMonthToken = abbrevs.some((token) =>
        item.periodLabel.toLowerCase().includes(token.toLowerCase()),
      );
      expect(
        hasMonthToken,
        `items[${index}].periodLabel "${item.periodLabel}" should reference month ${item.month}`,
      ).toBe(true);
    }
  }

  validateDpPeriodLabels(items: NetworkTrendDailyItem[]): void {
    for (const [index, item] of items.entries()) {
      expect(item.periodLabel.trim().length, `items[${index}].periodLabel`).toBeGreaterThan(0);
      expect(item.periodLabel).toMatch(DP_PERIOD_LABEL_RE);
      const parsed = parseIsoDate(item.date);
      expect(item.periodLabel).toBe(formatDpPeriodLabel(parsed));
    }
  }

  validateLsHourTimeAlignment(items: NetworkTrendHourlyItem[]): void {
    for (const [index, item] of items.entries()) {
      const expectedHour = NETWORK_TREND_HOUR_KEYS[index];
      expect(item.hour).toBe(expectedHour);
      expect(item.time).toBe(expectedHourTime(index));
    }
  }

  validatePeriodLabels(data: NetworkTrendData): void {
    if (isMonthlyTrendData(data)) {
      this.validateBillingPeriodLabels(data.items);
      return;
    }

    if (isDailyTrendData(data)) {
      this.validateDpPeriodLabels(data.items);
      return;
    }

    this.validateLsHourTimeAlignment(data.items);
  }

  validateLossPct(
    items: Array<{ lossPct: number }>,
  ): void {
    for (const [index, item] of items.entries()) {
      expect(Number.isFinite(item.lossPct), `items[${index}].lossPct`).toBe(true);
      expect(item.lossPct).toBeGreaterThanOrEqual(0);
      expect(item.lossPct).toBeLessThanOrEqual(100);
    }
  }

  validateNoDuplicatePeriods(data: NetworkTrendData): void {
    if (isMonthlyTrendData(data)) {
      const keys = data.items.map((item) => monthYearKey(item.month, item.year));
      expect(new Set(keys).size).toBe(data.items.length);
      return;
    }

    if (isDailyTrendData(data)) {
      const keys = data.items.map((item) => item.date);
      expect(new Set(keys).size).toBe(data.items.length);
      return;
    }

    const keys = data.items.map((item) => item.hour);
    expect(new Set(keys).size).toBe(data.items.length);
  }

  validateMonthlySequence(
    items: NetworkTrendMonthlyItem[],
    anchorMonth: number,
    anchorYear: number,
  ): void {
    const last = items[items.length - 1];
    expect(last.month).toBe(anchorMonth);
    expect(last.year).toBe(anchorYear);

    const firstExpected = addMonths(
      anchorMonth,
      anchorYear,
      -(NETWORK_TREND_DAILY_PERIOD_COUNT - 1),
    );
    const first = items[0];
    expect(first.month).toBe(firstExpected.month);
    expect(first.year).toBe(firstExpected.year);

    for (let index = 1; index < items.length; index += 1) {
      const prev = items[index - 1];
      const current = items[index];
      const expected = addMonths(prev.month, prev.year, 1);
      expect(current.month).toBe(expected.month);
      expect(current.year).toBe(expected.year);
    }
  }

  validateDailySequence(
    items: NetworkTrendDailyItem[],
    anchorDate: string,
  ): void {
    const anchor = parseIsoDate(anchorDate);
    const last = items[items.length - 1];
    expect(last.date).toBe(anchorDate);

    const firstExpected = new Date(anchor);
    firstExpected.setUTCDate(
      firstExpected.getUTCDate() - (NETWORK_TREND_DAILY_PERIOD_COUNT - 1),
    );
    expect(items[0].date).toBe(
      `${firstExpected.getUTCFullYear()}-${String(firstExpected.getUTCMonth() + 1).padStart(2, "0")}-${String(firstExpected.getUTCDate()).padStart(2, "0")}`,
    );

    for (let index = 1; index < items.length; index += 1) {
      const prev = parseIsoDate(items[index - 1].date);
      const expected = new Date(prev);
      expected.setUTCDate(expected.getUTCDate() + 1);
      const current = items[index];
      expect(current.date).toBe(
        `${expected.getUTCFullYear()}-${String(expected.getUTCMonth() + 1).padStart(2, "0")}-${String(expected.getUTCDate()).padStart(2, "0")}`,
      );
    }
  }

  validateHourlySequence(items: NetworkTrendHourlyItem[]): void {
    expect(items.map((item) => item.hour)).toEqual([...NETWORK_TREND_HOUR_KEYS]);
    for (const [index, item] of items.entries()) {
      expect(item.time).toBe(expectedHourTime(index));
    }
  }

  validateChronologicalOrder(data: NetworkTrendData): void {
    if (isMonthlyTrendData(data)) {
      this.validateMonthlySequence(
        data.items,
        data.anchorMonth,
        data.anchorYear,
      );
      return;
    }

    if (isDailyTrendData(data)) {
      this.validateDailySequence(data.items, data.anchorDate);
      return;
    }

    this.validateHourlySequence(data.items);
  }

  validateCrossFieldLogic(
    data: NetworkTrendData,
    query: NetworkTrendQuery,
  ): void {
    this.validateReportTypeEcho(data, query);
    this.validateAnchorFields(data, query["report-type"]);
    this.validateItemCount(data);
    this.validateItemNullRules(data);
    this.validatePeriodLabels(data);
    this.validateLossPct(data.items);
    this.validateNoDuplicatePeriods(data);
    this.validateChronologicalOrder(data);
  }

  validateAll(
    response: NetworkTrendResponse,
    query: NetworkTrendQuery,
  ): NetworkTrendData {
    this.validateResponse(response);
    const data = mapNetworkTrendData(response);
    this.validateCrossFieldLogic(data, query);
    return data;
  }
}
