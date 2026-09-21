import { expect } from "@playwright/test";
import {
  EXPECTED_CHART_PERIODS,
  EXPECTED_CONSUMER_CATEGORY_LABELS,
} from "../Data/alarms-events-category-chart.data";
import {
  AlarmsEventsCategoryChartData,
  AlarmsEventsCategoryChartPeriod,
  AlarmsEventsCategoryChartResponse,
} from "../Mapper/alarms-events-category-chart.mapper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import {
  AlarmsEventsCategoryChartSuccessResponseSchema,
  ApiErrorResponseSchema,
} from "../Schemas/alarms-events.schemas";

export class AlarmsEventsCategoryChartValidator {
  validateResponse(response: AlarmsEventsCategoryChartResponse) {
    assertZodSchema(
      AlarmsEventsCategoryChartSuccessResponseSchema,
      response,
      "Zod Response Schema",
    );
  }

  validateCategory(
    data: AlarmsEventsCategoryChartData,
    expectedSlug?: string,
    expectedLabel?: string,
  ) {
    expect(data.category).toBeTruthy();
    expect(data.label).toBeTruthy();
    if (expectedSlug) {
      expect(data.category).toBe(expectedSlug);
    }
    if (expectedLabel) {
      expect(data.label).toBe(expectedLabel);
    }
  }

  validatePeriods(data: AlarmsEventsCategoryChartData) {
    for (const name of EXPECTED_CHART_PERIODS) {
      this.validatePeriod(data[name], name);
    }
  }

  validatePeriod(period: AlarmsEventsCategoryChartPeriod, expectedName: string) {
    expect(period.period).toBe(expectedName);
    expect(period.totalMeterCount).toBeGreaterThanOrEqual(0);
    expect(Object.keys(period.categories).sort()).toEqual(
      [...EXPECTED_CONSUMER_CATEGORY_LABELS].sort(),
    );

    let meterSum = 0;
    let percentSum = 0;
    for (const label of EXPECTED_CONSUMER_CATEGORY_LABELS) {
      const bucket = period.categories[label];
      expect(bucket).toBeDefined();
      expect(bucket.meterCount).toBeGreaterThanOrEqual(0);
      expect(bucket.percentage).toBeGreaterThanOrEqual(0);
      expect(bucket.percentage).toBeLessThanOrEqual(100);
      meterSum += bucket.meterCount;
      percentSum += bucket.percentage;
    }
    expect(meterSum).toBe(period.totalMeterCount);
    if (period.totalMeterCount === 0) {
      expect(percentSum).toBe(0);
      return;
    }
    expect(Math.abs(percentSum - 100)).toBeLessThanOrEqual(0.15);
  }

  validateUniqueConsumerCategories(data: AlarmsEventsCategoryChartData) {
    for (const name of EXPECTED_CHART_PERIODS) {
      const labels = Object.keys(data[name].categories);
      expect(new Set(labels).size).toBe(labels.length);
    }
  }

  validateValidationError(body: AlarmsEventsCategoryChartResponse) {
    assertZodSchema(ApiErrorResponseSchema, body, "Zod Error Schema");
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  }
}
