import { expect } from "@playwright/test";
import {
  EventRestorationResponse,
  EventRestorationRow,
} from "../Mapper/eventrestoration.mapper";
export class EventRestorationValidator {
  validateResponse(response: EventRestorationResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data.rows.length).toBeGreaterThan(0);
  }
  ValidateMandatoryFields(rows: EventRestorationRow[]): void {
    for (const row of rows) {
      if (row.circle) {
        expect(
          row.circle.trim().length,
          `Invalid circle for MSN: ${row.msn}`,
        ).toBeGreaterThan(0);
      }
      expect(row.eventName).toBeTruthy();
      expect(row.msn).toBeTruthy();
      expect(row.occurrenceTime).toBeTruthy();
    }
  }

  validateSequentialSLNo(rows: EventRestorationRow[]): void {
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(index + 1);
    });
  }
  validateUniqueSLNO(rows: EventRestorationRow[]): void {
    const slNoset = new Set<number>();
    for (const row of rows) {
      expect(slNoset.has(row.slNo)).toBeFalsy();
      slNoset.add(row.slNo);
    }
  }
  validateNoDuplicateEvents(rows: EventRestorationRow[]): void {
    const eventSet = new Set<string>();
    for (const row of rows) {
      const key = `${row.msn}-${row.eventName}-${row.occurrenceTime}`;
      expect(eventSet.has(key)).toBeFalsy();
      eventSet.add(key);
    }
  }
  validateOccurenceTimeFormat(rows: EventRestorationRow[]): void {
    const regex = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
    for (const row of rows) {
      expect(regex.test(row.occurrenceTime)).toBeTruthy();
    }
  }
  validateScopedMeterCount(response: EventRestorationResponse): void {
    expect(response.data.scopedMeterCount).toBeGreaterThan(0);
  }
  validateTruncatedFlag(response: EventRestorationResponse): void {
    if (response.data.rows.length >= response.data.limit) {
      expect(response.data.truncated).toBeTruthy();
    }
  }
}
