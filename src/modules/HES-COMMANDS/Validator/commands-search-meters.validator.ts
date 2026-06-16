import { expect } from "@playwright/test";
import {
  MappedSearchMetersData,
  SearchMeterRow,
  SearchMetersResponse,
} from "../Mapper/commands-search-meters.mapper";

const NODE_ID_PATTERN = /^[0-9a-f]{2}(-[0-9a-f]{2}){7}$/i;
const METER_ID_PATTERN = /^[@A-Za-z0-9_-]+$/;
const FIRMWARE_PATTERN = /^[A-Za-z0-9._-]+$/;

export class CommandsSearchMetersValidator {
  validateResponse(body: SearchMetersResponse): void {
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  }

  validateErrorResponse(body: SearchMetersResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateResultCount(meters: SearchMeterRow[], itemCount: number): void {
    expect(meters.length).toBe(itemCount);
  }

  validateUniqueMeterIds(meters: SearchMeterRow[]): void {
    const ids = meters.map((row) => row.meterId);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateMeterId(row: SearchMeterRow): void {
    expect(row.meterId.length).toBeGreaterThan(0);
    expect(row.meterId).toBe(row.meterId.trim());
    expect(METER_ID_PATTERN.test(row.meterId)).toBe(true);
  }

  validateNodeId(row: SearchMeterRow): void {
    if (row.nodeId === null) {
      return;
    }
    expect(row.nodeId.length).toBeGreaterThan(0);
    expect(NODE_ID_PATTERN.test(row.nodeId)).toBe(true);
  }

  validateVendor(row: SearchMeterRow): void {
    expect(row.vendor.length).toBeGreaterThan(0);
    expect(row.vendor).toBe(row.vendor.trim());
  }

  validateFirmwareVersion(row: SearchMeterRow): void {
    expect(row.firmwareVersion.length).toBeGreaterThan(0);
    expect(FIRMWARE_PATTERN.test(row.firmwareVersion)).toBe(true);
  }

  validateHardwareVersion(row: SearchMeterRow): void {
    expect(row.hardwareVersion.length).toBeGreaterThan(0);
    expect(row.hardwareVersion).toBe(row.hardwareVersion.trim());
  }

  validateTimestamps(row: SearchMeterRow): void {
    const createTime = Date.parse(row.createTime);
    const updateTime = Date.parse(row.updateTime);
    expect(Number.isFinite(createTime)).toBe(true);
    expect(Number.isFinite(updateTime)).toBe(true);
    expect(updateTime).toBeGreaterThanOrEqual(createTime);
  }

  validateStringFieldsTrimmed(row: SearchMeterRow): void {
    expect(row.meterId).toBe(row.meterId.trim());
    if (row.nodeId !== null) {
      expect(row.nodeId).toBe(row.nodeId.trim());
    }
    expect(row.vendor).toBe(row.vendor.trim());
    expect(row.firmwareVersion).toBe(row.firmwareVersion.trim());
    expect(row.hardwareVersion).toBe(row.hardwareVersion.trim());
    expect(row.createTime).toBe(row.createTime.trim());
    expect(row.updateTime).toBe(row.updateTime.trim());
  }

  validateMeterRow(row: SearchMeterRow): void {
    this.validateMeterId(row);
    this.validateNodeId(row);
    this.validateVendor(row);
    this.validateFirmwareVersion(row);
    this.validateHardwareVersion(row);
    this.validateTimestamps(row);
    this.validateStringFieldsTrimmed(row);
  }

  validateAllMeters(meters: SearchMeterRow[]): void {
    for (const row of meters) {
      this.validateMeterRow(row);
    }
  }

  validateExpectedMeterIds(
    meters: SearchMeterRow[],
    expectedMeterIds: readonly string[],
  ): void {
    expect(meters.map((row) => row.meterId)).toEqual([...expectedMeterIds]);
  }

  validateKnownMeterPresent(meters: SearchMeterRow[], meterId: string): void {
    const ids = meters.map((row) => row.meterId);
    expect(ids).toContain(meterId);
  }

  validatePaginationWindow(
    meters: SearchMeterRow[],
    itemStart: number,
    itemCount: number,
  ): void {
    expect(meters.length).toBe(itemCount);
    expect(itemStart).toBeGreaterThan(0);
    expect(itemCount).toBeGreaterThan(0);
  }

  validateFullContract(
    mapped: MappedSearchMetersData,
    itemStart: number,
    itemCount: number,
    expectedMeterIds?: readonly string[],
  ): void {
    this.validateResultCount(mapped.meters, itemCount);
    this.validateUniqueMeterIds(mapped.meters);
    this.validateAllMeters(mapped.meters);
    this.validatePaginationWindow(mapped.meters, itemStart, itemCount);
    if (expectedMeterIds) {
      this.validateExpectedMeterIds(mapped.meters, expectedMeterIds);
    }
  }
}
