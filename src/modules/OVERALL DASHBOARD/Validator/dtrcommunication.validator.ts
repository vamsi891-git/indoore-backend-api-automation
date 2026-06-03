import { expect } from "@playwright/test";
import {
  RawDtrCommunicationData,
  dtrCommunicationResponse,
} from "../Mapper/dtrcommunication.mapper";
export class DtrCommunicationValidator {
  validateResponse(response: dtrCommunicationResponse) {
    expect(response.success).toBeTruthy();
  }
  validateNonNegative(data: RawDtrCommunicationData) {
    expect(data.totalActiveDtrMeters).toBeGreaterThanOrEqual(0);
    expect(data.communicatingMeters).toBeGreaterThanOrEqual(0);
    expect(data.nonCommunicatingMeters).toBeGreaterThanOrEqual(0);
  }
  validateAggregation(data: RawDtrCommunicationData) {
    expect(data.communicatingMeters + data.nonCommunicatingMeters).toBe(
      data.totalActiveDtrMeters,
    );
  }
  validateRowsCount(data: RawDtrCommunicationData) {
    expect(data.rows.length).toBeLessThanOrEqual(data.pagination.pageSize);
  }
  validateStatusValues(data: RawDtrCommunicationData) {
    const allowed = ["communicating", "non-communicating"];

    for (const row of data.rows) {
      expect(allowed.includes(row.status)).toBeTruthy();
    }
  }

  validateMeterUniqueness(data: RawDtrCommunicationData) {
    const ids = data.rows.map((x) => x.meterId);

    expect(new Set(ids).size).toBe(ids.length);
  }

  validateDayTrend(data: RawDtrCommunicationData) {
    for (const row of data.day) {
      expect(row.communicatingMeters + row.nonCommunicatingMeters).toBe(
        data.totalActiveDtrMeters,
      );
    }
  }

  validateMonthTrend(data: RawDtrCommunicationData) {
    for (const row of data.month) {
      expect(row.communicatingMeters + row.nonCommunicatingMeters).toBe(
        data.totalActiveDtrMeters,
      );
    }
  }
}
