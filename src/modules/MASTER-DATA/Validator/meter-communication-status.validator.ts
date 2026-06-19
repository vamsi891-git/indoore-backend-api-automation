import { expect } from "@playwright/test";
import {
  EXPECTED_METER_COMM_COLUMNS,
  ALLOWED_COMMUNICATION_STATUSES,
  type CommunicationStatus,
} from "../Data/meter-communication-status.data";
import {
  MeterCommunicationStatusData,
  MeterCommunicationStatusQuery,
  MeterCommunicationStatusResponse,
} from "../Mapper/meter-communication-status.mapper";

const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

export class MeterCommunicationStatusValidator {
  validateResponse(response: MeterCommunicationStatusResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  /** Backend: communicating + nonCommunicating + unknown = activeMeters; activeMeters = pagination.total */
  validateSummaryCounts(data: MeterCommunicationStatusData): void {
    expect(data.communicatingCount).toBeGreaterThanOrEqual(0);
    expect(data.nonCommunicatingCount).toBeGreaterThanOrEqual(0);
    expect(data.unknownCount).toBeGreaterThanOrEqual(0);
    expect(data.activeMeters).toBeGreaterThanOrEqual(0);

    expect(
      data.communicatingCount + data.nonCommunicatingCount + data.unknownCount,
    ).toEqual(data.activeMeters);

    expect(data.activeMeters).toEqual(data.total);
  }

  validateColumns(data: MeterCommunicationStatusData): void {
    expect(data.columns.length).toEqual(EXPECTED_METER_COMM_COLUMNS.length);
    EXPECTED_METER_COMM_COLUMNS.forEach((expected, index) => {
      expect(data.columns[index]?.key).toEqual(expected.key);
      expect(data.columns[index]?.header).toEqual(expected.header);
    });
  }

  validateItemsExist(data: MeterCommunicationStatusData): void {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(data: MeterCommunicationStatusData): void {
    data.items.forEach((item) => {
      expect(Number.isInteger(item.slNo)).toBeTruthy();
      expect(item.slNo).toBeGreaterThan(0);

      expect(ALLOWED_COMMUNICATION_STATUSES).toContain(
        item.communicationStatus as CommunicationStatus,
      );

      if (item.meterSerialNumber !== null) {
        expect(item.meterSerialNumber.trim()).not.toEqual("");
      }

      if (item.lastCommunication !== null) {
        expect(item.lastCommunication.trim()).not.toEqual("");
        expect(ISO_DATE_REGEX.test(item.lastCommunication)).toBeTruthy();
        expect(Number.isNaN(Date.parse(item.lastCommunication))).toBeFalsy();
      }
    });
  }

  validatePagination(data: MeterCommunicationStatusData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);

    if (data.total === 0) {
      expect(data.totalPages).toEqual(0);
      expect(data.items.length).toEqual(0);
      return;
    }

    const expectedPages = Math.ceil(data.total / data.limit);
    expect(data.totalPages).toEqual(expectedPages);
    expect(data.items.length).toBeLessThanOrEqual(data.limit);

    if (data.page < data.totalPages) {
      expect(data.items.length).toEqual(data.limit);
    } else if (data.page === data.totalPages) {
      const remainder = data.total % data.limit;
      const expectedRows = remainder === 0 ? data.limit : remainder;
      expect(data.items.length).toEqual(expectedRows);
    }
  }

  validateQueryParams(
    data: MeterCommunicationStatusData,
    query: MeterCommunicationStatusQuery,
  ): void {
    expect(data.page).toEqual(query.page ?? 1);
    expect(data.limit).toEqual(query.limit ?? 20);
  }

  /** Backend paged slNo: offset + 1 … offset + n */
  validateSlNoSequence(data: MeterCommunicationStatusData): void {
    const offset = (data.page - 1) * data.limit;
    data.items.forEach((item, index) => {
      expect(item.slNo).toEqual(offset + index + 1);
    });
  }

  validateUniqueMeterSerialsOnPage(data: MeterCommunicationStatusData): void {
    const serials = data.items
      .map((row) => row.meterSerialNumber?.trim())
      .filter((msn): msn is string => Boolean(msn));
    expect(new Set(serials).size).toEqual(serials.length);
  }

  /** When communicationStatus filter is applied, every row must match. */
  validateCommunicationStatusFilter(
    data: MeterCommunicationStatusData,
    status: CommunicationStatus,
  ): void {
    data.items.forEach((item) => {
      expect(item.communicationStatus).toEqual(status);
    });
  }

  /** Global summary counts must be >= page-level status counts. */
  validatePageStatusCountsWithinSummary(data: MeterCommunicationStatusData): void {
    const pageCounts = {
      communicating: 0,
      "non-communicating": 0,
      unknown: 0,
    };
    for (const row of data.items) {
      const key = row.communicationStatus as keyof typeof pageCounts;
      if (key in pageCounts) {
        pageCounts[key] += 1;
      }
    }

    expect(pageCounts.communicating).toBeLessThanOrEqual(data.communicatingCount);
    expect(pageCounts["non-communicating"]).toBeLessThanOrEqual(
      data.nonCommunicatingCount,
    );
    expect(pageCounts.unknown).toBeLessThanOrEqual(data.unknownCount);
  }

  /** Active meters with communicating status should have lastCommunication timestamp. */
  validateCommunicatingRowsHaveTimestamp(data: MeterCommunicationStatusData): void {
    const communicatingRows = data.items.filter(
      (row) => row.communicationStatus === "communicating",
    );
    for (const row of communicatingRows) {
      expect(
        row.lastCommunication,
        `Meter ${row.meterSerialNumber ?? row.slNo} is communicating but lastCommunication is null`,
      ).not.toBeNull();
    }
  }

  /** Search q: serial contains query (case-insensitive). */
  validateSearchResults(
    data: MeterCommunicationStatusData,
    searchTerm: string,
  ): void {
    const q = searchTerm.trim().toLowerCase();
    expect(q.length).toBeGreaterThan(0);
    data.items.forEach((item) => {
      const serial = (item.meterSerialNumber ?? "").toLowerCase();
      expect(serial.includes(q)).toBeTruthy();
    });
  }

  validateRowKeysMatchColumns(data: MeterCommunicationStatusData): void {
    const keys = data.columns.map((c) => c.key);
    data.items.forEach((item) => {
      keys.forEach((key) => {
        expect(item).toHaveProperty(key);
      });
    });
  }
}
