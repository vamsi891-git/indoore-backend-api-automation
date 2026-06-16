import { expect } from "@playwright/test";
import {
  CommandsMeterLookupResponse,
  CommandsMeterLookupRow,
} from "../Mapper/commands-meter.mapper";

/** Known phase values returned by the API. */
export const KNOWN_METER_PHASES = ["1 PH", "3PH WC", "HT"] as const;

export class CommandsMeterValidator {
  validateResponse(body: CommandsMeterLookupResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  }

  validateErrorResponse(body: CommandsMeterLookupResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  /** Contract for unknown / out-of-scope serial (404 path). */
  validateNotFoundResponse(body: CommandsMeterLookupResponse): void {
    this.validateErrorResponse(body);
  }

  /** API: meterLookupId — positive integer. */
  validateMeterLookupId(row: CommandsMeterLookupRow): void {
    expect(Number.isInteger(row.meterLookupId)).toBe(true);
    expect(row.meterLookupId).toBeGreaterThan(0);
  }

  /** API: meterSerialNumber matches request; numeric; no surrounding whitespace. */
  validateMeterSerialNumber(
    row: CommandsMeterLookupRow,
    requestedSerial: string,
  ): void {
    const expected = requestedSerial.trim();
    expect(row.meterSerialNumber).toBe(expected);
    expect(row.meterSerialNumber).toBe(row.meterSerialNumber.trim());
    expect(/^\d+$/.test(row.meterSerialNumber)).toBe(true);
  }

  /** API: consumerName present for a resolved in-scope meter. */
  validateConsumerName(row: CommandsMeterLookupRow): void {
    expect(row.consumerName).toBeTruthy();
    expect(row.consumerName!.trim().length).toBeGreaterThan(0);
  }

  /** API: phase is a non-empty known meter phase value. */
  validatePhase(row: CommandsMeterLookupRow): void {
    expect(row.phase).toBeTruthy();
    expect(row.phase!.trim().length).toBeGreaterThan(0);
    expect(KNOWN_METER_PHASES).toContain(row.phase);
  }

  /** API: ivrsNumber present and trimmed. */
  validateIvrsNumber(row: CommandsMeterLookupRow): void {
    expect(row.ivrsNumber).toBeTruthy();
    expect(row.ivrsNumber!.trim().length).toBeGreaterThan(0);
    expect(row.ivrsNumber).toBe(row.ivrsNumber!.trim());
    expect(row.ivrsNumber).toMatch(/^N\d+$/);
  }

  validateNullableFieldsTrimmed(row: CommandsMeterLookupRow): void {
    if (row.consumerName !== null) {
      expect(row.consumerName).toBe(row.consumerName.trim());
    }
    if (row.phase !== null) {
      expect(row.phase).toBe(row.phase.trim());
    }
    if (row.feeder !== null) {
      expect(row.feeder).toBe(row.feeder.trim());
    }
    if (row.dtr !== null) {
      expect(row.dtr).toBe(row.dtr.trim());
    }
  }

  /** API: feeder non-empty when returned. */
  validateFeeder(row: CommandsMeterLookupRow): void {
    if (row.feeder !== null) {
      expect(row.feeder.trim().length).toBeGreaterThan(0);
    }
  }

  /** API: dtr non-empty when returned. */
  validateDtr(row: CommandsMeterLookupRow): void {
    if (row.dtr !== null) {
      expect(row.dtr.trim().length).toBeGreaterThan(0);
    }
  }

  /** API: feeder and dtr populated for in-scope meter details. */
  validateNetworkHierarchy(row: CommandsMeterLookupRow): void {
    expect(row.feeder).toBeTruthy();
    expect(row.dtr).toBeTruthy();
  }

  validateFullMeterDetails(
    row: CommandsMeterLookupRow,
    requestedSerial: string,
  ): void {
    this.validateMeterLookupId(row);
    this.validateMeterSerialNumber(row, requestedSerial);
    this.validateConsumerName(row);
    this.validatePhase(row);
    this.validateIvrsNumber(row);
    this.validateFeeder(row);
    this.validateDtr(row);
    this.validateNetworkHierarchy(row);
    this.validateNullableFieldsTrimmed(row);
  }
}
