import { expect } from "@playwright/test";
import {
  CommunicationTrendData,
  CommunicationTrendPoint,
  CommunicationTrendResponse,
} from "../Mapper/communication-trend.mapper";

function ymdDaysInclusive(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000) + 1;
}

function addCalendarDay(ymd: string, delta: number): string {
  const [year, month, day] = ymd.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}

export class CommunicationTrendValidator {
  validateResponse(response: CommunicationTrendResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateDates(data: CommunicationTrendData) {
    expect(data.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.fromDate <= data.toDate).toBeTruthy();
  }

  validateWindow(
    data: CommunicationTrendData,
    expectedFromDate?: string,
    expectedToDate?: string,
    expectSameDayWindow?: boolean,
  ) {
    this.validateDates(data);
    if (expectedFromDate) {
      expect(data.fromDate).toBe(expectedFromDate);
    }
    if (expectedToDate) {
      expect(data.toDate).toBe(expectedToDate);
    }
    if (expectSameDayWindow) {
      expect(data.fromDate).toBe(data.toDate);
    }
  }

  validateTrend(data: CommunicationTrendData) {
    expect(data.communicationTrend.length).toBeGreaterThan(0);
    for (const item of data.communicationTrend) {
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.ipCount).toBeGreaterThanOrEqual(0);
      expect(item.dpCount).toBeGreaterThanOrEqual(0);
      expect(item.lsCount).toBeGreaterThanOrEqual(0);
    }
    this.validateUniqueTrendDates(data);
  }

  validateUniqueTrendDates(data: CommunicationTrendData) {
    const dates = data.communicationTrend.map((item) => item.date);
    expect(new Set(dates).size).toBe(dates.length);
  }

  validateTrendMatchesWindow(data: CommunicationTrendData) {
    const expectedDays = ymdDaysInclusive(data.fromDate, data.toDate);
    expect(data.communicationTrend.length).toBe(expectedDays);
    expect(data.communicationTrend[0]?.date).toBe(data.fromDate);
    expect(data.communicationTrend.at(-1)?.date).toBe(data.toDate);
    data.communicationTrend.forEach((point, index) => {
      expect(point.date).toBe(addCalendarDay(data.fromDate, index));
    });
  }

  validateZeroCounts(data: CommunicationTrendData) {
    for (const item of data.communicationTrend) {
      expect(item.ipCount).toBe(0);
      expect(item.dpCount).toBe(0);
      expect(item.lsCount).toBe(0);
    }
  }

  validateSubsetDoesNotExceedAll(
    allMeters: CommunicationTrendData,
    subset: CommunicationTrendData,
  ) {
    const byDate = new Map(
      allMeters.communicationTrend.map((point) => [point.date, point]),
    );
    expect(subset.communicationTrend.length).toBe(
      allMeters.communicationTrend.length,
    );
    for (const point of subset.communicationTrend) {
      const allPoint = byDate.get(point.date);
      expect(allPoint).toBeDefined();
      expect(point.ipCount).toBeLessThanOrEqual(allPoint!.ipCount);
      expect(point.dpCount).toBeLessThanOrEqual(allPoint!.dpCount);
      expect(point.lsCount).toBeLessThanOrEqual(allPoint!.lsCount);
    }
  }

  validateSameDates(
    left: CommunicationTrendPoint[],
    right: CommunicationTrendPoint[],
  ) {
    expect(left.map((point) => point.date)).toEqual(
      right.map((point) => point.date),
    );
  }
}
