import { expect } from "@playwright/test";
import { EXPECTED_CHART_PERIODS, EXPECTED_CHART_PHASES } from "../Data/alarms-events-chart.data";
import {
  AlarmsEventsChartData,
  AlarmsEventsChartPeriod,
  AlarmsEventsChartResponse,
} from "../Mapper/alarms-events-chart.mapper";

export class AlarmsEventsChartValidator {
  validateResponse(response: AlarmsEventsChartResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }
  validateCategory(data: AlarmsEventsChartData, expectedSlug?: string, expectedLabel?: string) {
    expect(data.category).toBeTruthy();
    expect(data.label).toBeTruthy();
    if (expectedSlug) {
      expect(data.category).toBe(expectedSlug);
    }
    if (expectedLabel) {
      expect(data.label).toBe(expectedLabel);
    }
  }
  validatePeriods(data: AlarmsEventsChartData) {
    for (const name of EXPECTED_CHART_PERIODS) {
      this.validatePeriod(data[name], name);
    }
  }
  validatePeriod(period: AlarmsEventsChartPeriod, expectedName: string) {
    expect(period.period).toBe(expectedName);
    expect(Number.isFinite(period.totalMeterCount)).toBeTruthy();
    expect(period.totalMeterCount).toBeGreaterThanOrEqual(0);

    expect(Object.keys(period.phases).sort()).toEqual([...EXPECTED_CHART_PHASES].sort());

    let meterSum = 0;
    let percentSum = 0;
    for (const phaseName of EXPECTED_CHART_PHASES) {
      const phase = period.phases[phaseName];
      expect(phase).toBeDefined();
      expect(Number.isFinite(phase.meterCount)).toBeTruthy();
      expect(phase.meterCount).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(phase.percentage)).toBeTruthy();
      expect(phase.percentage).toBeGreaterThanOrEqual(0);
      expect(phase.percentage).toBeLessThanOrEqual(100);
      meterSum += phase.meterCount;
      percentSum += phase.percentage;
    }
    expect(meterSum).toBe(period.totalMeterCount);
    if (period.totalMeterCount === 0) {
      expect(percentSum).toBe(0);
      return;
    }
    expect(Math.abs(percentSum - 100)).toBeLessThan(0.1);
  }
  validateValidateError(body: AlarmsEventsChartResponse) {
    expect(body.success).toBeFalsy();
    expect(body.error).toBeDefined();
    expect(body.error?.code).toBe("VALIDATION_ERROR");
    expect(body.error?.message).toBeTruthy();
  }
}
