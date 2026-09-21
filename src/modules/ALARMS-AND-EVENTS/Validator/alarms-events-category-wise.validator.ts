import { expect } from "@playwright/test";
import {
  EXPECTED_CATEGORY_WISE_COLUMNS,
  EXPECTED_CATEGORY_WISE_ROWS,
} from "../Data/alarms-events-category-wise.data";
import {
  AlarmsEventsCategoryWiseData,
  AlarmsEventsCategoryWiseResponse,
} from "../Mapper/alarms-events-category-wise.mapper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import {
  AlarmsEventsCategoryWiseSuccessResponseSchema,
  ApiErrorResponseSchema,
} from "../Schemas/alarms-events.schemas";

function addCalendarDay(ymd: string, delta: number): string {
  const [year, month, day] = ymd.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}

export class AlarmsEventsCategoryWiseValidator {
  validateResponse(response: AlarmsEventsCategoryWiseResponse) {
    assertZodSchema(AlarmsEventsCategoryWiseSuccessResponseSchema, response, "Zod Response Schema");
  }

  validateDates(data: AlarmsEventsCategoryWiseData, expectedCurrentDate?: string) {
    expect(data.currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.previousDate).toBe(addCalendarDay(data.currentDate, -1));
    if (expectedCurrentDate) {
      expect(data.currentDate).toBe(expectedCurrentDate);
    }
  }

  validateColumns(data: AlarmsEventsCategoryWiseData) {
    expect(data.categories.length).toBeGreaterThan(0);
    for (const row of data.categories) {
      expect(Object.keys(row).sort()).toEqual([...EXPECTED_CATEGORY_WISE_COLUMNS].sort());
    }
  }

  validateExpectedCategories(data: AlarmsEventsCategoryWiseData) {
    expect(data.categories.map((row) => row.category)).toEqual(
      EXPECTED_CATEGORY_WISE_ROWS.map((row) => row.slug),
    );
    expect(data.categories.map((row) => row.label)).toEqual(
      EXPECTED_CATEGORY_WISE_ROWS.map((row) => row.label),
    );
  }

  validateUniqueCategories(data: AlarmsEventsCategoryWiseData) {
    const slugs = data.categories.map((row) => row.category);
    const labels = data.categories.map((row) => row.label);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validateTotals(data: AlarmsEventsCategoryWiseData) {
    const totalSum = data.categories.reduce((sum, row) => sum + row.totalCount, 0);
    const previousSum = data.categories.reduce((sum, row) => sum + row.previousCount, 0);
    expect(totalSum).toBe(data.totalEvents);
    expect(previousSum).toBe(data.totalEventsPreviousDay);
    expect(data.totalEvents).toBeGreaterThanOrEqual(0);
    expect(data.totalEventsPreviousDay).toBeGreaterThanOrEqual(0);
    for (const row of data.categories) {
      expect(row.totalCount).toBeGreaterThanOrEqual(0);
      expect(row.count).toBeGreaterThanOrEqual(0);
      expect(row.previousCount).toBeGreaterThanOrEqual(0);
    }
  }

  validateValidationError(body: AlarmsEventsCategoryWiseResponse) {
    assertZodSchema(ApiErrorResponseSchema, body, "Zod Error Schema");
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  }
}
