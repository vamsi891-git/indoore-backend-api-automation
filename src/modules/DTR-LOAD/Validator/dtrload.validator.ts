import { expect } from "@playwright/test";
import {
  dtrLoadColumnsByType,
  type DtrLoadType,
} from "../Data/dtrload.data";
import type { DtrLoadPayload } from "../Mapper/dtrload.mapper";
import type { DtrLoadRow } from "../schemas/dtrload.schemas";

function hourValues(row: DtrLoadRow): Array<number | null | undefined> {
  return [
    row.H1, row.H2, row.H3, row.H4, row.H5, row.H6, row.H7, row.H8,
    row.H9, row.H10, row.H11, row.H12, row.H13, row.H14, row.H15, row.H16,
    row.H17, row.H18, row.H19, row.H20, row.H21, row.H22, row.H23, row.H24,
  ];
}

function meterKey(row: DtrLoadRow): string {
  return (
    row.meterSerialNumber ??
    row.msn ??
    (row.meterLookupId != null ? String(row.meterLookupId) : "") ??
    row.id ??
    ""
  );
}

export class DtrLoadValidator {
  validateColumns(
    columns: Array<{ key: string; header: string }>,
    type: DtrLoadType,
  ): void {
    const keys = columns.map((c) => c.key);
    for (const col of dtrLoadColumnsByType[type]) {
      expect(keys).toContain(col.key);
      expect(columns.find((c) => c.key === col.key)?.header).toBe(col.header);
    }
  }

  validatePagination(data: DtrLoadPayload): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.rows.length).toBeLessThanOrEqual(data.limit);
    if (data.total != null) {
      expect(data.total).toBeGreaterThanOrEqual(data.rows.length);
    }
  }

  validateRowsPresent(data: DtrLoadPayload): void {
    data.rows.forEach((row) => {
      expect(meterKey(row)).toBeTruthy();
      if (row.meterLookupId != null) {
        expect(row.meterLookupId).toBeGreaterThan(0);
      }
      if (row.mf != null) {
        expect(row.mf).toBeGreaterThan(0);
      }
    });
  }

  /**
   * Duplicate meter / lookup / row id / DTR name on one page is a fail.
   * Same feeder, zone, or circle on many DTRs is valid.
   */
  validateUniqueMeters(data: DtrLoadPayload): void {
    const ids = data.rows.filter((r) => r.id).map((r) => r.id);
    const lookups = data.rows
      .filter((r) => r.meterLookupId != null)
      .map((r) => r.meterLookupId);
    const meters = data.rows.map((r) => meterKey(r)).filter(Boolean);
    const dtrs = data.rows.filter((r) => r.dtrName).map((r) => r.dtrName);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(lookups).size).toBe(lookups.length);
    expect(new Set(meters).size).toBe(meters.length);
    expect(new Set(dtrs).size).toBe(dtrs.length);
  }

  validateSharedKeysAllowed(data: DtrLoadPayload): void {
    if (data.rows.length < 2) {
      return;
    }
    const feeders = data.rows.map((r) => r.feeder);
    expect(new Set(feeders).size).toBeLessThanOrEqual(feeders.length);
  }

  validateMsnMatchesSerial(data: DtrLoadPayload): void {
    data.rows.forEach((row) => {
      if (row.msn && row.meterSerialNumber) {
        expect(row.msn).toBe(row.meterSerialNumber);
      }
    });
  }

  validateHourlyNonNegative(data: DtrLoadPayload): void {
    data.rows.forEach((row) => {
      hourValues(row).forEach((value) => {
        if (value != null) {
          expect(value).toBeGreaterThanOrEqual(0);
        }
      });
    });
  }

  validateHourlyTotals(data: DtrLoadPayload): void {
    data.rows.forEach((row) => {
      const hours = hourValues(row).filter(
        (value): value is number => typeof value === "number",
      );
      if (hours.length === 0) {
        return;
      }
      const sum = hours.reduce((acc, value) => acc + value, 0);
      const min = Math.min(...hours);
      const max = Math.max(...hours);
      if (row.totalHourlyKva != null) {
        const slack = Math.max(1, hours.length * 0.05);
        expect(Math.abs(sum - row.totalHourlyKva)).toBeLessThanOrEqual(slack);
      }
      if (row.avgKva != null) {
        expect(row.avgKva).toBeGreaterThanOrEqual(min);
        expect(row.avgKva).toBeLessThanOrEqual(max);
      }
    });
  }

  validateLoadingPercent(data: DtrLoadPayload): void {
    data.rows.forEach((row) => {
      const rating = row.dtrRatingKva ?? row.dtrRating;
      if (row.loadingKva == null || rating == null || rating <= 0) {
        return;
      }
      if (row.loadPercent == null) {
        return;
      }
      const expected = (row.loadingKva / rating) * 100;
      expect(Math.abs(expected - row.loadPercent)).toBeLessThanOrEqual(0.5);
    });
  }

  validateUnbalancePhases(data: DtrLoadPayload): void {
    data.rows.forEach((row) => {
      for (const phase of [row.IR, row.IY, row.IB]) {
        if (phase != null) {
          expect(phase).toBeGreaterThanOrEqual(0);
        }
      }
      if (row.loadVariation != null) {
        expect(row.loadVariation).toBeGreaterThanOrEqual(0);
      }
    });
  }

  validateSummaryLoads(data: DtrLoadPayload): void {
    data.rows.forEach((row) => {
      if (row.minLoadKva != null) {
        expect(row.minLoadKva).toBeGreaterThanOrEqual(0);
      }
      if (row.maxLoadKva != null && row.minLoadKva != null) {
        expect(row.maxLoadKva).toBeGreaterThanOrEqual(row.minLoadKva);
      }
      if (row.maxLoadPercent != null) {
        expect(row.maxLoadPercent).toBeGreaterThanOrEqual(0);
      }
      if (row.kWh != null) {
        expect(row.kWh).toBeGreaterThanOrEqual(0);
      }
    });
  }

  validateConsumptionUnit(
    data: DtrLoadPayload,
    query?: { fromDate?: string; toDate?: string },
  ): void {
    const expectedLogDate =
      query?.fromDate && query?.toDate
        ? `${query.fromDate}/${query.toDate}`
        : null;
    data.rows.forEach((row) => {
      if (row.hourlyValuesUnit) {
        expect(row.hourlyValuesUnit.trim()).not.toEqual("");
      }
      if (row.logDate) {
        expect(row.logDate).toMatch(/^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/);
        if (expectedLogDate) {
          expect(row.logDate).toBe(expectedLogDate);
        }
      }
    });
  }

  validateNoData(data: DtrLoadPayload): void {
    if (data.total === 0) {
      expect(data.rows.length).toBe(0);
    }
  }
}
