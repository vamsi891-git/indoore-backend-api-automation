import { expect } from "@playwright/test";
import {
  EXPECTED_CHART_PERIODS,
  EXPECTED_PRIORITY_CHART_DATASET_COLUMNS,
  EXPECTED_PRIORITY_CHART_PERIOD_COLUMNS,
  EXPECTED_PRIORITY_CHART_SERIES,
} from "../Data/alarms-events-priority-chart.data";
import {
  AlarmsEventsPriorityChartData,
  AlarmsEventsPriorityChartPeriod,
  AlarmsEventsPriorityChartResponse,
} from "../Mapper/alarms-events-priority-chart.mapper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import {
  AlarmsEventsPriorityChartSuccessResponseSchema,
  ApiErrorResponseSchema,
} from "../Schemas/alarms-events.schemas";

export class AlarmsEventsPriorityChartValidator {
  validateResponse(response: AlarmsEventsPriorityChartResponse) {
    assertZodSchema(
      AlarmsEventsPriorityChartSuccessResponseSchema,
      response,
      "Zod Response Schema",
    );
  }

  validatePriority(
    data: AlarmsEventsPriorityChartData,
    expectedPriority?: string,
    expectedLabel?: string,
  ) {
    expect(data.priority).toBeTruthy();
    expect(data.label).toBeTruthy();
    if (expectedPriority) {
      expect(data.priority).toBe(expectedPriority);
    }
    if (expectedLabel) {
      expect(data.label).toBe(expectedLabel);
    }
  }

  validatePeriods(data: AlarmsEventsPriorityChartData, expectedDate?: string) {
    for (const name of EXPECTED_CHART_PERIODS) {
      this.validatePeriod(data[name], name, expectedDate);
    }
  }

  validatePeriod(
    period: AlarmsEventsPriorityChartPeriod,
    expectedName: string,
    expectedDate?: string,
  ) {
    expect(period.period).toBe(expectedName);
    expect(Object.keys(period).sort()).toEqual([...EXPECTED_PRIORITY_CHART_PERIOD_COLUMNS].sort());
    expect(period.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(period.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(period.toDate >= period.fromDate).toBe(true);
    expect(period.totalCount).toBeGreaterThanOrEqual(0);
    expect(period.labels.length).toBeGreaterThan(0);
    expect(new Set(period.labels).size).toBe(period.labels.length);
    const seriesLabels = period.datasets.map((row) => row.label);
    for (const series of EXPECTED_PRIORITY_CHART_SERIES) {
      expect(seriesLabels).toContain(series);
    }

    for (const dataset of period.datasets) {
      expect(Object.keys(dataset).sort()).toEqual(
        [...EXPECTED_PRIORITY_CHART_DATASET_COLUMNS].sort(),
      );
      expect(dataset.data.length).toBe(period.labels.length);
      expect(dataset.meterCount.length).toBe(period.labels.length);
      for (let index = 0; index < dataset.data.length; index += 1) {
        expect(dataset.data[index]).toBeGreaterThanOrEqual(0);
        expect(dataset.meterCount[index]).toBeGreaterThanOrEqual(0);
      }
    }

    if (expectedName === "hourly" && expectedDate) {
      expect(period.fromDate).toBe(expectedDate);
      expect(period.toDate).toBe(expectedDate);
    }
  }

  validateUniqueSeries(data: AlarmsEventsPriorityChartData) {
    for (const name of EXPECTED_CHART_PERIODS) {
      const labels = data[name].datasets.map((row) => row.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  }

  validateValidationError(body: AlarmsEventsPriorityChartResponse) {
    assertZodSchema(ApiErrorResponseSchema, body, "Zod Error Schema");
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  }
}
