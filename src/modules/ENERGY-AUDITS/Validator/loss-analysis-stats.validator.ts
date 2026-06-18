import { expect } from "@playwright/test";

import {
  expectedHourTime,
  expectedTotalLoss,
  hourKeyToIndex,
  isValidIsoDate,
  LOSS_ANALYSIS_STATS_HOUR_KEYS,
  LossAnalysisStatsData,
  LossAnalysisStatsHourBucket,
  LossAnalysisStatsQuery,
  LossAnalysisStatsResponse,
  mapLossAnalysisStatsData,
  parseIsoDate,
} from "../Mapper/loss-analysis-stats.mapper";
const METRIC_EPSILON = 0.01;
const HOUR_TIME_RE = /^([01]\d|2[0-3]):00$/;
export class LossAnalysisStatsValidator {
  validateResponse(response: LossAnalysisStatsResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.peakLossHour).toBeDefined();
    expect(response.data.lowestLossHour).toBeDefined();
  }
  validateQueryEcho(data: LossAnalysisStatsData,query: LossAnalysisStatsQuery,): void {
    expect(data.networkLookupId).toBe(query.networkLookupId);
    expect(data.fromDate).toBe(query.fromDate);
    expect(data.toDate).toBe(query.toDate);
  }
  validateDateFields(data: LossAnalysisStatsData): void {
    expect(isValidIsoDate(data.fromDate)).toBe(true);
    expect(isValidIsoDate(data.toDate)).toBe(true);
    expect(parseIsoDate(data.fromDate).getTime()).toBeLessThanOrEqual(
      parseIsoDate(data.toDate).getTime(),
    );
  }
  validateEnergyMetricTypes(data: LossAnalysisStatsData): void {
    expect(Number.isFinite(data.networkLookupId)).toBe(true);
    expect(data.networkLookupId).toBeGreaterThan(0);
    expect(Number.isFinite(data.totalEnergyInput)).toBe(true);
    expect(Number.isFinite(data.totalConsumption)).toBe(true);
    expect(Number.isFinite(data.totalLoss)).toBe(true);
  }
  validateNonNegativeTotals(data: LossAnalysisStatsData): void {
    expect(data.totalEnergyInput).toBeGreaterThanOrEqual(0);
    expect(data.totalConsumption).toBeGreaterThanOrEqual(0);
    expect(data.totalLoss).toBeGreaterThanOrEqual(0);
  }
  validateTotalLossMath(data: LossAnalysisStatsData): void {
    const expected = expectedTotalLoss(
      data.totalEnergyInput,
      data.totalConsumption,
    );
    expect(
      Math.abs(data.totalLoss - expected),
      `totalLoss should equal max(0, input - consumption)`,
    ).toBeLessThanOrEqual(METRIC_EPSILON);
  }
  validateLossNotExceedingInput(data: LossAnalysisStatsData): void {
    expect(data.totalLoss).toBeLessThanOrEqual(
      data.totalEnergyInput + METRIC_EPSILON,
    );
  }
  validateHourBucket(bucket: LossAnalysisStatsHourBucket,label: string,): void {
    expect(bucket.hour.trim().length, `${label}.hour`).toBeGreaterThan(0);
    expect(bucket.time.trim().length, `${label}.time`).toBeGreaterThan(0);
    expect(bucket.hour).toMatch(/^H([1-9]|1\d|2[0-4])$/);
    expect(LOSS_ANALYSIS_STATS_HOUR_KEYS).toContain(bucket.hour);
    expect(bucket.time).toMatch(HOUR_TIME_RE);
    const hourIndex = hourKeyToIndex(bucket.hour);
    expect(hourIndex).not.toBeNull();
    expect(bucket.time).toBe(expectedHourTime(hourIndex!));
    expect(Number.isFinite(bucket.lossPct), `${label}.lossPct`).toBe(true);
    expect(bucket.lossPct).toBeGreaterThanOrEqual(0);
    expect(bucket.lossPct).toBeLessThanOrEqual(100);
  }
  validatePeakLossHour(data: LossAnalysisStatsData): void {
    this.validateHourBucket(data.peakLossHour, "peakLossHour");
  }
  validateLowestLossHour(data: LossAnalysisStatsData): void {
    this.validateHourBucket(data.lowestLossHour, "lowestLossHour");
  }
  validatePeakVsLowest(data: LossAnalysisStatsData): void {
    expect(data.peakLossHour.lossPct).toBeGreaterThanOrEqual(
      data.lowestLossHour.lossPct,
    );
  }
  validateZeroDataConsistency(data: LossAnalysisStatsData): void {
    if (data.totalEnergyInput !== 0 || data.totalConsumption !== 0) {
      return;
    }
    expect(data.totalLoss).toBe(0);
    expect(data.peakLossHour.lossPct).toBe(0);
    expect(data.lowestLossHour.lossPct).toBe(0);
  }

  validateCrossFieldLogic(data: LossAnalysisStatsData,query: LossAnalysisStatsQuery,): void {
    this.validateQueryEcho(data, query);
    this.validateDateFields(data);
    this.validateEnergyMetricTypes(data);
    this.validateNonNegativeTotals(data);
    this.validateTotalLossMath(data);
    this.validateLossNotExceedingInput(data);
    this.validatePeakLossHour(data);
    this.validateLowestLossHour(data);
    this.validatePeakVsLowest(data);
    this.validateZeroDataConsistency(data);
  }

  validateAll( response: LossAnalysisStatsResponse, query: LossAnalysisStatsQuery): LossAnalysisStatsData {
    this.validateResponse(response);
    const data = mapLossAnalysisStatsData(response);
    this.validateCrossFieldLogic(data, query);
    return data;
  }
}
