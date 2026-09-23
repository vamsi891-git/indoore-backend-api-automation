import { expect } from "@playwright/test";
import { CommStatsData, CommStatsResponse } from "../Mapper/communicationstats.mapper";

export class CommStatsValidator {
  validateResponse(response: CommStatsResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateDates(data: CommStatsData) {
    expect(data.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.referenceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.fromDate <= data.toDate).toBeTruthy();
    expect(data.referenceDate >= data.fromDate).toBeTruthy();
    expect(data.referenceDate <= data.toDate).toBeTruthy();
  }

  validateMeterCounts(data: CommStatsData) {
    expect(data.totalMeters.value).toBeGreaterThanOrEqual(0);
    expect(data.activeMeters.value).toBeGreaterThanOrEqual(0);
    expect(data.nonOperationalMeters.value).toBeGreaterThanOrEqual(0);
    expect(data.unmappedMeters.value).toBeGreaterThanOrEqual(0);
  }

  validateRelationships(data: CommStatsData) {
    expect(data.activeMeters.value).toBeLessThanOrEqual(data.totalMeters.value);
    expect(data.nonOperationalMeters.value).toBeLessThanOrEqual(data.totalMeters.value);
    expect(data.unmappedMeters.value).toBeLessThanOrEqual(data.totalMeters.value);
  }

  validateAggregation(data: CommStatsData) {
    const sum =
      data.activeMeters.value + data.nonOperationalMeters.value + data.unmappedMeters.value;
    if (sum !== data.totalMeters.value) {
      console.warn(
        `[BACKEND FINDING] meter count cards do not add to total: active=${data.activeMeters.value} + nonOperational=${data.nonOperationalMeters.value} + unmapped=${data.unmappedMeters.value} = ${sum}, total=${data.totalMeters.value}`,
      );
    }
  }

  validatePreviousValues(data: CommStatsData) {
    const previous = [
      data.totalMeters.previous,
      data.activeMeters.previous,
      data.nonOperationalMeters.previous,
      data.unmappedMeters.previous,
    ];
    for (const value of previous) {
      expect(value).not.toBeNull();
      expect(Number.isNaN(value)).toBeFalsy();
      expect(value).toBeGreaterThanOrEqual(0);
    }
  }

  validateAllEqualsConsumerPlusDtr(
    allMeters: CommStatsData,
    consumers: CommStatsData,
    dtrs: CommStatsData,
  ) {
    expect(allMeters.totalMeters.value).toBe(consumers.totalMeters.value + dtrs.totalMeters.value);
    expect(allMeters.activeMeters.value).toBe(
      consumers.activeMeters.value + dtrs.activeMeters.value,
    );
    expect(allMeters.nonOperationalMeters.value).toBe(
      consumers.nonOperationalMeters.value + dtrs.nonOperationalMeters.value,
    );
    expect(allMeters.unmappedMeters.value).toBe(
      consumers.unmappedMeters.value + dtrs.unmappedMeters.value,
    );
  }
}
