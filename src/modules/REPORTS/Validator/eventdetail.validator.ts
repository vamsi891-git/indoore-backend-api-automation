import { expect } from "@playwright/test";
import {
  EventDetailResponse,
  EventDetailRow,
} from "../Mapper/eventdetail.mapper";
export class EventDetailValidator {
  validateResponse(response: EventDetailResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data.rows.length).toBeGreaterThan(0);
  }
  validateMandatoryFields(rows: EventDetailRow[]): void {
    for (const row of rows) {
      expect(row.eventId).toBeGreaterThan(0);
      expect(row.eventName).toBeTruthy();
      expect(row.msn).toBeTruthy();
      expect(row.ivrsNumber).toBeTruthy();
    }
  }
  validateEventCount(rows: EventDetailRow[]): void {
    for (const row of rows) {
      expect(row.eventCount).toBeGreaterThan(0);
    }
  }
  validateDurationFormat(rows: EventDetailRow[]): void {
    const regex = /^(\d+:\d{2}|NA)$/;
    for (const row of rows) {
      console.log("Duration:", row.durationHhMm);
      expect(
        regex.test(row.durationHhMm),
        `Invalid duration:
       ${row.durationHhMm}`,
      ).toBeTruthy();
    }
  }
  ValidateUniqueSLNo(rows: EventDetailRow[]): void {
    const slNoSet = new Set<number>();
    for (const row of rows) {
      expect(slNoSet.has(row.slNo)).toBeFalsy();
      slNoSet.add(row.slNo);
    }
  }
  validateSequentialSLNo(rows: EventDetailRow[]): void {
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(index + 1);
    });
  }
  validateTotalRowCount(response: EventDetailResponse): void {
    expect(response.data.totalRowCount).toBeGreaterThanOrEqual(
      response.data.rows.length,
    );
  }
  validateScopedMeterCount(response: EventDetailResponse): void {
    expect(response.data.scopedMeterCount).toBeGreaterThanOrEqual(
      response.data.rows.length,
    );
  }
  validateEventClassificationName(rows: EventDetailRow[]): void {
    for (const row of rows) {
      if (row.eventClassificationName === "Critical") {
        expect(row.eventName).toBeTruthy();
      }
    }
  }
  validateNoDuplicateConsumerEvents(rows: EventDetailRow[]): void {
    const consumerEventSet = new Set<string>();
    for (const row of rows) {
      const key = `${row.ivrsNumber}-${row.eventId}-${row.slNo}`;
      expect(consumerEventSet.has(key)).toBeFalsy();
      consumerEventSet.add(key);
    }
  }
}
