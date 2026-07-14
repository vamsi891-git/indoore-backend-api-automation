import { expect } from "@playwright/test";
import {
  ProgressChart,
  ProgressData,
} from "../Mapper/progress.mapper";
import { progressData } from "../Data/progress.data";

const ROOT_REQUIRED_FIELDS = ["weekly", "monthly"] as const;
const CHART_REQUIRED_FIELDS = ["labels", "values"] as const;

export class ProgressValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateRootStructure(
    data: ProgressData & { success?: boolean },
  ) {
    expect(typeof data).toBe("object");
  }

  validateRequiredRootFields(
    data: ProgressData,
  ) {
    ROOT_REQUIRED_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  validateWeeklyObject(weekly: ProgressChart) {
    expect(typeof weekly).toBe("object");
    expect(weekly).not.toBeNull();
  }

  validateMonthlyObject(monthly: ProgressChart) {
    expect(typeof monthly).toBe("object");
    expect(monthly).not.toBeNull();
  }

  validateChartRequiredFields(chart: ProgressChart) {
    CHART_REQUIRED_FIELDS.forEach((field) => {
      expect(chart).toHaveProperty(field);
    });
  }

  validateChartTypes(chart: ProgressChart) {
    expect(Array.isArray(chart.labels)).toBeTruthy();
    expect(Array.isArray(chart.values)).toBeTruthy();
  }

  validateWeeklyBucketCount(weekly: ProgressChart) {
    expect(weekly.labels.length).toBe(
      progressData.weeklyBucketCount,
    );
    expect(weekly.values.length).toBe(
      progressData.weeklyBucketCount,
    );
  }

  validateMonthlyBucketCount(monthly: ProgressChart) {
    expect(monthly.labels.length).toBe(
      progressData.monthlyBucketCount,
    );
    expect(monthly.values.length).toBe(
      progressData.monthlyBucketCount,
    );
  }

  validateWeeklyLabels(weekly: ProgressChart) {
    expect(weekly.labels).toEqual([
      ...progressData.expectedWeeklyLabels,
    ]);
  }

  validateMonthlyLabels(monthly: ProgressChart) {
    expect(monthly.labels).toEqual([
      ...progressData.expectedMonthlyLabels,
    ]);
  }

  validateLabelsAreStrings(chart: ProgressChart) {
    chart.labels.forEach((label) => {
      expect(typeof label).toBe("string");
      expect(label.trim().length).toBeGreaterThan(0);
    });
  }

  validateLabelsTrimmed(chart: ProgressChart) {
    chart.labels.forEach((label) => {
      expect(label).toBe(label.trim());
    });
  }

  validateValuesAreNumbers(chart: ProgressChart) {
    chart.values.forEach((value) => {
      expect(typeof value).toBe("number");
      expect(Number.isFinite(value)).toBeTruthy();
    });
  }

  validateValuesAreIntegers(chart: ProgressChart) {
    chart.values.forEach((value) => {
      expect(Number.isInteger(value)).toBeTruthy();
    });
  }

  validateValuesNonNegative(chart: ProgressChart) {
    chart.values.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(
        progressData.minimumCount,
      );
    });
  }

  validateValuesSafeInteger(chart: ProgressChart) {
    chart.values.forEach((value) => {
      expect(value).toBeLessThanOrEqual(
        progressData.maximumSafeInteger,
      );
    });
  }

  validateLabelsValuesLengthParity(chart: ProgressChart) {
    expect(chart.labels.length).toBe(chart.values.length);
  }

  validateUniqueLabels(chart: ProgressChart) {
    expect(new Set(chart.labels).size).toBe(
      chart.labels.length,
    );
  }

  validateNoNullCriticalFields(data: ProgressData) {
    expect(data.weekly).not.toBeNull();
    expect(data.monthly).not.toBeNull();
    expect(data.weekly.labels).not.toBeNull();
    expect(data.weekly.values).not.toBeNull();
    expect(data.monthly.labels).not.toBeNull();
    expect(data.monthly.values).not.toBeNull();
  }

  validateNoUndefinedCriticalFields(data: ProgressData) {
    expect(data.weekly).not.toBeUndefined();
    expect(data.monthly).not.toBeUndefined();
    expect(data.weekly.labels).not.toBeUndefined();
    expect(data.weekly.values).not.toBeUndefined();
    expect(data.monthly.labels).not.toBeUndefined();
    expect(data.monthly.values).not.toBeUndefined();
  }

  validateChartObjectSize(chart: ProgressChart) {
    expect(Object.keys(chart).length).toBe(2);
  }

  validateChartNoExtraFields(chart: ProgressChart) {
    expect(Object.keys(chart).sort()).toEqual([
      "labels",
      "values",
    ]);
  }

  validateRootObjectSize(
    data: ProgressData & { success?: boolean },
  ) {
    expect(Object.keys(data).length).toBe(3);
  }

  validateNoExtraRootFields(
    data: ProgressData & { success?: boolean },
  ) {
    expect(Object.keys(data).sort()).toEqual([
      "monthly",
      "success",
      "weekly",
    ]);
  }

  validateResponseIntegrity(data: ProgressData) {
    expect(data.weekly.labels.length).toBeGreaterThan(0);
    expect(data.weekly.values.length).toBeGreaterThan(0);
    expect(data.monthly.labels.length).toBeGreaterThan(0);
    expect(data.monthly.values.length).toBeGreaterThan(0);
  }

  validateZeroProgressScenario(data: ProgressData) {
    const weeklySum = data.weekly.values.reduce(
      (sum, value) => sum + value,
      0,
    );
    const monthlySum = data.monthly.values.reduce(
      (sum, value) => sum + value,
      0,
    );

    if (weeklySum === 0) {
      data.weekly.values.forEach((value) => {
        expect(value).toBe(0);
      });
    }

    if (monthlySum === 0) {
      data.monthly.values.forEach((value) => {
        expect(value).toBe(0);
      });
    }
  }

  validateWeeklyMonthlyIndependence(data: ProgressData) {
    expect(data.weekly).not.toBe(data.monthly);
    expect(data.weekly.labels).not.toEqual(
      data.monthly.labels,
    );
  }

  validateWeeklyLabelFormat(weekly: ProgressChart) {
    weekly.labels.forEach((label) => {
      expect(
        /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(label),
      ).toBeTruthy();
    });
  }

  validateMonthlyLabelFormat(monthly: ProgressChart) {
    monthly.labels.forEach((label) => {
      expect(/^Week [1-5]$/.test(label)).toBeTruthy();
    });
  }

  validateWeeklyValuesCountMatch(weekly: ProgressChart) {
    expect(weekly.values.length).toBe(
      weekly.labels.length,
    );
  }

  validateMonthlyValuesCountMatch(monthly: ProgressChart) {
    expect(monthly.values.length).toBe(
      monthly.labels.length,
    );
  }

  validateValuesNotNull(chart: ProgressChart) {
    chart.values.forEach((value) => {
      expect(value).not.toBeNull();
      expect(value).not.toBeUndefined();
      expect(Number.isNaN(value)).toBeFalsy();
    });
  }

  validateLabelsNotEmpty(chart: ProgressChart) {
    expect(chart.labels.length).toBeGreaterThan(0);
    chart.labels.forEach((label) => {
      expect(label.length).toBeGreaterThan(0);
    });
  }

  validateBusinessRules(data: ProgressData) {
    expect(data).toHaveProperty("weekly");
    expect(data).toHaveProperty("monthly");
    expect(data.weekly.labels.length).toBe(
      progressData.weeklyBucketCount,
    );
    expect(data.monthly.labels.length).toBe(
      progressData.monthlyBucketCount,
    );
  }

  validateWeeklySumNonNegative(weekly: ProgressChart) {
    const sum = weekly.values.reduce(
      (total, value) => total + value,
      0,
    );
    expect(sum).toBeGreaterThanOrEqual(0);
  }

  validateMonthlySumNonNegative(monthly: ProgressChart) {
    const sum = monthly.values.reduce(
      (total, value) => total + value,
      0,
    );
    expect(sum).toBeGreaterThanOrEqual(0);
  }

  validateWeeklyOrderedLabels(weekly: ProgressChart) {
    expect(weekly.labels.join(",")).toBe(
      progressData.expectedWeeklyLabels.join(","),
    );
  }

  validateMonthlyOrderedLabels(monthly: ProgressChart) {
    expect(monthly.labels.join(",")).toBe(
      progressData.expectedMonthlyLabels.join(","),
    );
  }

  validateNoExtraWeeklyLabel(
    weekly: ProgressChart,
  ) {
    weekly.labels.forEach((label) => {
      expect(
        progressData.expectedWeeklyLabels,
      ).toContain(label);
    });
  }

  validateNoExtraMonthlyLabel(
    monthly: ProgressChart,
  ) {
    monthly.labels.forEach((label) => {
      expect(
        progressData.expectedMonthlyLabels,
      ).toContain(label);
    });
  }

  validateChartsArePlainObjects(data: ProgressData) {
    expect(Array.isArray(data.weekly)).toBeFalsy();
    expect(Array.isArray(data.monthly)).toBeFalsy();
  }

  validateUnauthorizedError(
    status: number,
    body: {
      success?: boolean;
      error?: { code?: string; message?: string };
    },
  ) {
    expect(status).toBe(
      progressData.expectedUnauthorizedStatus,
    );
    expect(body.success).toBeFalsy();
    expect([
      progressData.expectedUnauthorizedCode,
      progressData.expectedInvalidTokenCode,
    ]).toContain(body.error?.code);
    expect(
      typeof body.error?.message,
    ).toBe("string");
    expect(
      (body.error?.message ?? "").trim().length,
    ).toBeGreaterThan(0);
  }

  validateDisallowedMethodRejected(status: number) {
    expect([403, 404, 405, 501]).toContain(status);
  }

  validateSuccessEnvelopePreserved(
    body: ProgressResponseLike,
  ) {
    expect(body.success).toBeTruthy();
    expect(body.data).toBeDefined();
    expect(body.data?.weekly).toBeDefined();
    expect(body.data?.monthly).toBeDefined();
  }
}

type ProgressResponseLike = {
  success?: boolean;
  data?: {
    weekly?: ProgressChart;
    monthly?: ProgressChart;
  };
};
