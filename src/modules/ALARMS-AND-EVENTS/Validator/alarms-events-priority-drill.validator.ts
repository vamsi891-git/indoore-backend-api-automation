import { expect } from "@playwright/test";
import {
  EXPECTED_PRIORITY_DRILL_COLUMNS,
  alarmsEventsPriorityDrillData,
} from "../Data/alarms-events-priority-drill.data";
import {
  AlarmsEventsPriorityDrillData,
  AlarmsEventsPriorityDrillResponse,
} from "../Mapper/alarms-events-priority-drill.mapper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import {
  AlarmsEventsPriorityDrillSuccessResponseSchema,
  ApiErrorResponseSchema,
} from "../Schemas/alarms-events.schemas";

const DURATION = /^\d+:\d{2}$/;

export class AlarmsEventsPriorityDrillValidator {
  validateResponse(response: AlarmsEventsPriorityDrillResponse) {
    assertZodSchema(
      AlarmsEventsPriorityDrillSuccessResponseSchema,
      response,
      "Zod Response Schema",
    );
  }

  validateColumns(data: AlarmsEventsPriorityDrillData) {
    expect(data.columns.map((col) => col.key)).toEqual(
      EXPECTED_PRIORITY_DRILL_COLUMNS.map((col) => col.key),
    );
    expect(data.columns.map((col) => col.header)).toEqual(
      EXPECTED_PRIORITY_DRILL_COLUMNS.map((col) => col.header),
    );
  }

  validateContext(
    data: AlarmsEventsPriorityDrillData,
    options: {
      expectedPrioritySlug?: string;
      expectedCategorySlug?: string;
      expectedSeries?: string;
      expectedDate?: string;
    },
  ) {
    const date = options.expectedDate ?? alarmsEventsPriorityDrillData.date;
    const series = options.expectedSeries ?? alarmsEventsPriorityDrillData.series;
    expect(data.context.view).toBe("priority-wise");
    expect(data.context.groupBy).toBe("circle");
    expect(data.context.hierarchyLevel).toBe("circle");
    expect(data.context.series).toBe(series);
    expect(data.context.date).toBe(date);
    expect(data.context.fromDate).toBe(date);
    expect(data.context.toDate).toBe(date);
    if (options.expectedPrioritySlug) {
      expect(data.context.priority).toBe(options.expectedPrioritySlug);
    }
    if (options.expectedCategorySlug) {
      expect(data.context.category).toBe(options.expectedCategorySlug);
    }
  }

  validateUniqueColumns(data: AlarmsEventsPriorityDrillData) {
    const keys = data.columns.map((col) => col.key);
    const headers = data.columns.map((col) => col.header);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(headers).size).toBe(headers.length);
  }

  validateUniqueRows(data: AlarmsEventsPriorityDrillData) {
    const ids = data.rows.map((row) => row.id);
    const eventIds = data.rows.map((row) => row.eventId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(eventIds).size).toBe(eventIds.length);
  }

  validatePaginationAndTotals(data: AlarmsEventsPriorityDrillData) {
    const { pagination, totals, rows } = data;
    expect(pagination.page).toBeGreaterThanOrEqual(1);
    expect(pagination.limit).toBeGreaterThanOrEqual(1);
    expect(pagination.total).toBeGreaterThanOrEqual(0);
    expect(pagination.totalPages).toBeGreaterThanOrEqual(0);
    expect(totals.totalRows).toBe(pagination.total);
    expect(totals.totalMeterCount).toBeGreaterThanOrEqual(0);
    expect(totals.totalEventCount).toBeGreaterThanOrEqual(0);
    expect(rows.length).toBeLessThanOrEqual(pagination.limit);
    if (pagination.total === 0) {
      expect(rows.length).toBe(0);
      expect(pagination.totalPages).toBe(0);
      expect(totals.totalMeterCount).toBe(0);
      expect(totals.totalEventCount).toBe(0);
    }
  }

  validateRows(data: AlarmsEventsPriorityDrillData, expectedLabel?: string) {
    for (const row of data.rows) {
      expect(row.id).toBeTruthy();
      expect(row.eventId).toBeGreaterThan(0);
      expect(row.eventName).toBeTruthy();
      expect(row.circleName).toBeTruthy();
      expect(row.circleId).toBeGreaterThan(0);
      expect(row.meterCount).toBeGreaterThanOrEqual(0);
      expect(row.eventCount).toBeGreaterThanOrEqual(0);
      expect(row.duration).toMatch(DURATION);
      if (row.eventClassificationName != null) {
        expect(row.eventClassificationName).toBeTruthy();
      }
      if (expectedLabel && row.eventClassificationName != null) {
        expect(row.eventClassificationName).toBe(expectedLabel);
      }
    }
    if (data.rows.length === data.pagination.total) {
      const meterSum = data.rows.reduce((sum, row) => sum + row.meterCount, 0);
      const eventSum = data.rows.reduce((sum, row) => sum + row.eventCount, 0);
      expect(meterSum).toBe(data.totals.totalMeterCount);
      expect(eventSum).toBe(data.totals.totalEventCount);
    }
  }

  validateValidationError(body: AlarmsEventsPriorityDrillResponse) {
    assertZodSchema(ApiErrorResponseSchema, body, "Zod Error Schema");
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  }
}
