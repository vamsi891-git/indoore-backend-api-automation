import { expect } from "@playwright/test";

import {
  expectedHourTime,
  hourKeyToIndex,
  isValidIsoDate,
  LOSS_ANALYSIS_TRENDS_HOUR_COUNT,
  LOSS_ANALYSIS_TRENDS_HOUR_KEYS,
  LossAnalysisTrendsData,
  LossAnalysisTrendsItem,
  LossAnalysisTrendsQuery,
  LossAnalysisTrendsResponse,
  mapLossAnalysisTrendsData,
} from "../Mapper/loss-analysis-trends.mapper";

const HOUR_TIME_RE = /^([01]\d|2[0-3]):00$/;

export class LossAnalysisTrendsValidator {
  validateResponse(response: LossAnalysisTrendsResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.items)).toBe(true);
  }

  validateQueryEcho(
    data: LossAnalysisTrendsData,
    query: LossAnalysisTrendsQuery,
  ): void {
    expect(data.networkLookupId).toBe(query.networkLookupId);
  }

  validateRootFields(data: LossAnalysisTrendsData): void {
    expect(Number.isFinite(data.networkLookupId)).toBe(true);
    expect(data.networkLookupId).toBeGreaterThan(0);
    expect(isValidIsoDate(data.date)).toBe(true);
    expect(data.date.trim().length).toBeGreaterThan(0);
  }

  validateItemCount(items: LossAnalysisTrendsItem[]): void {
    expect(items.length).toBe(LOSS_ANALYSIS_TRENDS_HOUR_COUNT);
  }

  validateItemShape(items: LossAnalysisTrendsItem[]): void {
    for (const [index, item] of items.entries()) {
      expect(item.hour.trim().length, `items[${index}].hour`).toBeGreaterThan(0);
      expect(item.time.trim().length, `items[${index}].time`).toBeGreaterThan(0);
      expect(item.hour).toMatch(/^H([1-9]|1\d|2[0-4])$/);
      expect(LOSS_ANALYSIS_TRENDS_HOUR_KEYS).toContain(item.hour);
      expect(item.time).toMatch(HOUR_TIME_RE);

      const hourIndex = hourKeyToIndex(item.hour);
      expect(hourIndex).not.toBeNull();
      expect(item.time).toBe(expectedHourTime(hourIndex!));
    }
  }

  validateLossPct(items: LossAnalysisTrendsItem[]): void {
    for (const [index, item] of items.entries()) {
      expect(Number.isFinite(item.lossPct), `items[${index}].lossPct`).toBe(true);
      expect(item.lossPct).toBeGreaterThanOrEqual(0);
      expect(item.lossPct).toBeLessThanOrEqual(100);
    }
  }

  validateNoDuplicateHours(items: LossAnalysisTrendsItem[]): void {
    const hours = items.map((item) => item.hour);
    expect(new Set(hours).size).toBe(items.length);
  }

  validateHourSequence(items: LossAnalysisTrendsItem[]): void {
    expect(items.map((item) => item.hour)).toEqual([
      ...LOSS_ANALYSIS_TRENDS_HOUR_KEYS,
    ]);

    for (const [index, item] of items.entries()) {
      expect(item.time).toBe(expectedHourTime(index));
    }
  }

  validateCrossFieldLogic(
    data: LossAnalysisTrendsData,
    query: LossAnalysisTrendsQuery,
  ): void {
    this.validateQueryEcho(data, query);
    this.validateRootFields(data);
    this.validateItemCount(data.items);
    this.validateItemShape(data.items);
    this.validateLossPct(data.items);
    this.validateNoDuplicateHours(data.items);
    this.validateHourSequence(data.items);
  }

  validateAll(
    response: LossAnalysisTrendsResponse,
    query: LossAnalysisTrendsQuery,
  ): LossAnalysisTrendsData {
    this.validateResponse(response);
    const data = mapLossAnalysisTrendsData(response);
    this.validateCrossFieldLogic(data, query);
    return data;
  }
}
