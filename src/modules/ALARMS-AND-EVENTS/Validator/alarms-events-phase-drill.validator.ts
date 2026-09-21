import { expect } from "@playwright/test";
import {
  EXPECTED_PHASE_DRILL_COLUMNS,
  alarmsEventsPhaseDrillData,
} from "../Data/alarms-events-phase-drill.data";
import {
  AlarmsEventsPhaseDrillData,
  AlarmsEventsPhaseDrillResponse,
} from "../Mapper/alarms-events-phase-drill.mapper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import {
  AlarmsEventsPhaseDrillSuccessResponseSchema,
  ApiErrorResponseSchema,
} from "../Schemas/alarms-events.schemas";

const DURATION = /^\d+:\d{2}$/;

export class AlarmsEventsPhaseDrillValidator {
  validateResponse(response: AlarmsEventsPhaseDrillResponse) {
    assertZodSchema(AlarmsEventsPhaseDrillSuccessResponseSchema, response, "Zod Response Schema");
  }

  validateColumns(data: AlarmsEventsPhaseDrillData) {
    expect(data.columns.map((col) => col.key)).toEqual(
      EXPECTED_PHASE_DRILL_COLUMNS.map((col) => col.key),
    );
    expect(data.columns.map((col) => col.header)).toEqual(
      EXPECTED_PHASE_DRILL_COLUMNS.map((col) => col.header),
    );
  }

  validateContext(
    data: AlarmsEventsPhaseDrillData,
    expectedSlug?: string,
    expectedSeries: string = alarmsEventsPhaseDrillData.series,
  ) {
    expect(data.context.view).toBe("phase-wise");
    expect(data.context.groupBy).toBe("circle");
    expect(data.context.hierarchyLevel).toBe("circle");
    expect(data.context.series).toBe(expectedSeries);
    expect(data.context.date).toBe(alarmsEventsPhaseDrillData.date);
    expect(data.context.fromDate).toBe(alarmsEventsPhaseDrillData.date);
    expect(data.context.toDate).toBe(alarmsEventsPhaseDrillData.date);
    if (expectedSlug) {
      expect(data.context.category).toBe(expectedSlug);
    }
  }
  validateUniqueColumns(data: AlarmsEventsPhaseDrillData) {
    const keys = data.columns.map((col) => col.key);
    const headers = data.columns.map((col) => col.header);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(headers).size).toBe(headers.length);
  }

  validateUniqueRows(data: AlarmsEventsPhaseDrillData) {
    const ids = data.rows.map((row) => row.id);
    const eventIds = data.rows.map((row) => row.eventId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(eventIds).size).toBe(eventIds.length);
  }

  validatePaginationAndTotals(data: AlarmsEventsPhaseDrillData) {
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

  validateRows(data: AlarmsEventsPhaseDrillData, expectedLabel?: string) {
    for (const row of data.rows) {
      expect(row.id).toBeTruthy();
      expect(row.eventId).toBeGreaterThan(0);
      expect(row.eventName).toBeTruthy();
      expect(row.circleName).toBeTruthy();
      expect(row.circleId).toBeGreaterThan(0);
      expect(row.meterCount).toBeGreaterThanOrEqual(0);
      expect(row.eventCount).toBeGreaterThanOrEqual(0);
      expect(row.duration).toMatch(DURATION);
      if (expectedLabel) {
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

  validateValidationError(body: AlarmsEventsPhaseDrillResponse) {
    assertZodSchema(ApiErrorResponseSchema, body, "Zod Error Schema");
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  }
}
