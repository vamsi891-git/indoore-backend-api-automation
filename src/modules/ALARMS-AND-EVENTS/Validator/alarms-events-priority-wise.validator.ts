import { expect } from "@playwright/test";
import {
  EXPECTED_PRIORITY_WISE_COLUMNS,
  EXPECTED_PRIORITY_WISE_ROWS,
  EXPECTED_PRIORITY_WISE_STATUS_COLUMNS,
} from "../Data/alarms-events-priority-wise.data";
import {
  AlarmsEventsPriorityWiseData,
  AlarmsEventsPriorityWiseResponse,
  AlarmsEventsPriorityWiseStatus,
} from "../Mappper/alarms-events-priority-wise.mapper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import {
  AlarmsEventsPriorityWiseSuccessResponseSchema,
  ApiErrorResponseSchema,
} from "../Schemas/alarms-events.schemas";

function addCalendarDay(ymd: string, delta: number): string {
  const [year, month, day] = ymd.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}

function statusKeys(status: AlarmsEventsPriorityWiseStatus) {
  return Object.keys(status).sort();
}

export class AlarmsEventsPriorityWiseValidator {
  validateResponse(response: AlarmsEventsPriorityWiseResponse) {
    assertZodSchema(
      AlarmsEventsPriorityWiseSuccessResponseSchema,
      response,
      "Zod Response Schema",
    );
  }

  validateDates(data: AlarmsEventsPriorityWiseData, expectedCurrentDate?: string) {
    expect(data.currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.previousDate).toBe(addCalendarDay(data.currentDate, -1));
    if (expectedCurrentDate) {
      expect(data.currentDate).toBe(expectedCurrentDate);
    }
  }

  validateColumns(data: AlarmsEventsPriorityWiseData) {
    expect(statusKeys(data.active)).toEqual(
      [...EXPECTED_PRIORITY_WISE_STATUS_COLUMNS].sort(),
    );
    expect(statusKeys(data.resolve)).toEqual(
      [...EXPECTED_PRIORITY_WISE_STATUS_COLUMNS].sort(),
    );
    expect(data.priorities.length).toBeGreaterThan(0);
    for (const row of data.priorities) {
      expect(Object.keys(row).sort()).toEqual(
        [...EXPECTED_PRIORITY_WISE_COLUMNS].sort(),
      );
    }
  }

  validateExpectedPriorities(
    data: AlarmsEventsPriorityWiseData,
    expectedPriorityIds?: readonly number[],
  ) {
    const expectedById = new Map<number, string>(
      EXPECTED_PRIORITY_WISE_ROWS.map((row) => [row.priorityId, row.label]),
    );
    expect(data.priorities.length).toBeGreaterThan(0);
    for (const row of data.priorities) {
      expect(expectedById.has(row.priorityId)).toBe(true);
      expect(row.label).toBe(expectedById.get(row.priorityId));
    }
    if (expectedPriorityIds) {
      expect(data.priorities.map((row) => row.priorityId)).toEqual([
        ...expectedPriorityIds,
      ]);
    }
  }

  validateUniquePriorities(data: AlarmsEventsPriorityWiseData) {
    const ids = data.priorities.map((row) => row.priorityId);
    const labels = data.priorities.map((row) => row.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validateTotals(data: AlarmsEventsPriorityWiseData) {
    expect(data.active.totalCount + data.resolve.totalCount).toBe(
      data.totalEvents,
    );
    expect(data.active.previousDay + data.resolve.previousDay).toBe(
      data.totalEventsPreviousDay,
    );
    expect(data.totalEvents).toBeGreaterThanOrEqual(0);
    expect(data.totalEventsPreviousDay).toBeGreaterThanOrEqual(0);
    for (const row of data.priorities) {
      expect(row.totalCount).toBeGreaterThanOrEqual(0);
      expect(row.count).toBeGreaterThanOrEqual(0);
      expect(row.previousCount).toBeGreaterThanOrEqual(0);
    }
  }

  validateValidationError(body: AlarmsEventsPriorityWiseResponse) {
    assertZodSchema(ApiErrorResponseSchema, body, "Zod Error Schema");
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  }
}
