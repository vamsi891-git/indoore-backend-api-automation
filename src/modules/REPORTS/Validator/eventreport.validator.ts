import { expect } from "@playwright/test";

import { EventReport, EventReportResponse } from "../Mapper/eventreport.mapper";
import { EventDetailRow } from "../Mapper/eventdetail.mapper";

export class EventReportValidator {
  validateResponse(response: EventReportResponse) {
    expect(response.success).toBeTruthy();

    expect(response.data.items.length).toBeGreaterThan(0);
  }

  validateNoEmptyItems(items: EventReport[]) {
    expect(items.length).toBeGreaterThan(0);
  }

  validateMandatoryFields(items: EventReport[]) {
    for (const row of items) {
      expect(row.circle).toBeTruthy();

      expect(row.eventName).toBeTruthy();

      expect(row.eventId).toBeGreaterThan(0);
    }
  }

  validateMetervsEventCount(items: EventReport[]) {
    for (const row of items) {
      expect(row.eventCount).toBeGreaterThanOrEqual(row.meterCount);
    }
  }

  validateScopedMeterCount(response: EventReportResponse) {
    for (const row of response.data.items) {
      expect(row.meterCount).toBeLessThanOrEqual(
        response.data.scopedMeterCount,
      );
    }
  }

  validateEventIdNameConsistency(items: EventReport[]) {
    const map = new Map<number, string>();

    for (const row of items) {
      if (!map.has(row.eventId)) {
        map.set(row.eventId, row.eventName);
      } else {
        expect(map.get(row.eventId)).toBe(row.eventName);
      }
    }
  }
 validateDurationFormat(rows: EventDetailRow[]): void {
    const regex = /^\d+:\d{2}$/;

    for (const row of rows) {
      console.log("DURATION:", row.durationHhMm);

      expect(
        regex.test(row.durationHhMm),

        `Invalid duration:
       ${row.durationHhMm}`,
      ).toBeTruthy();
    }
  }

  validatePositiveDuration(items: EventReport[]) {
    for (const row of items) {
      const duration = row.durationHhMm;
      console.log(duration);
      // =========================
      // Skip Invalid / NA Values
      // =========================
      if (!duration || duration === "NA") {
        continue;
      }
      const [hours, minutes] = duration.split(":").map(Number);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(60);
    }
  }

  validateUniqueGrouping(items: EventReport[]) {
    const set = new Set<string>();

    for (const row of items) {
      const key = `${row.circle}-${row.eventId}`;

      expect(set.has(key)).toBeFalsy();

      set.add(key);
    }
  }

  validateSequentialSLNo(items: EventReport[]) {
    items.forEach((row, index) => {
      expect(row.slNo).toBe(index + 1);
    });
  }

  validateDuplicateSlNo(items: EventReport[]) {
    const set = new Set<number>();

    for (const row of items) {
      expect(set.has(row.slNo)).toBeFalsy();

      set.add(row.slNo);
    }
  }
}
