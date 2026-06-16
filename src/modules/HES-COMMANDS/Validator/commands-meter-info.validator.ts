import { expect } from "@playwright/test";
import {
  CommandsMeterInfoResponse,
  CommandsMeterInfoRow,
} from "../Mapper/commands-meter-info.mapper";

/** HES node identifier (e.g. 00-1b-c5-0c-60-0b-9d-62). */
const NODE_ID_PATTERN = /^[0-9a-f]{2}(-[0-9a-f]{2}){7}$/i;

export class CommandsMeterInfoValidator {
  validateResponse(body: CommandsMeterInfoResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  }

  validateErrorResponse(body: CommandsMeterInfoResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateNotFoundResponse(body: CommandsMeterInfoResponse): void {
    this.validateErrorResponse(body);
  }

  validateMeterId(row: CommandsMeterInfoRow, requestedSerial: string): void {
    expect(row.meterId).toBe(requestedSerial.trim());
    expect(/^\d+$/.test(row.meterId)).toBe(true);
  }

  validateNodeId(row: CommandsMeterInfoRow): void {
    expect(row.nodeId.length).toBeGreaterThan(0);
    expect(NODE_ID_PATTERN.test(row.nodeId)).toBe(true);
  }

  validateVendor(row: CommandsMeterInfoRow): void {
    expect(row.vendor.length).toBeGreaterThan(0);
  }

  validateTimestamps(row: CommandsMeterInfoRow): void {
    const createTime = Date.parse(row.createTime);
    const updateTime = Date.parse(row.updateTime);
    expect(Number.isFinite(createTime)).toBe(true);
    expect(Number.isFinite(updateTime)).toBe(true);
    expect(updateTime).toBeGreaterThanOrEqual(createTime);
  }

  validateStringFieldsTrimmed(row: CommandsMeterInfoRow): void {
    expect(row.meterId).toBe(row.meterId.trim());
    expect(row.nodeId).toBe(row.nodeId.trim());
    expect(row.vendor).toBe(row.vendor.trim());
    expect(row.firmwareVersion).toBe(row.firmwareVersion.trim());
    expect(row.hardwareVersion).toBe(row.hardwareVersion.trim());
  }

  validateFirmwareVersion(row: CommandsMeterInfoRow): void {
    expect(row.firmwareVersion.length).toBeGreaterThan(0);
    expect(row.firmwareVersion).toMatch(/^[A-Za-z0-9._-]+$/);
  }

  validateHardwareVersion(row: CommandsMeterInfoRow): void {
    expect(row.hardwareVersion.length).toBeGreaterThan(0);
  }

  validateFullMeterInfo(
    row: CommandsMeterInfoRow,
    requestedSerial: string,
  ): void {
    this.validateMeterId(row, requestedSerial);
    this.validateNodeId(row);
    this.validateVendor(row);
    this.validateFirmwareVersion(row);
    this.validateHardwareVersion(row);
    this.validateTimestamps(row);
    this.validateStringFieldsTrimmed(row);
  }
}
