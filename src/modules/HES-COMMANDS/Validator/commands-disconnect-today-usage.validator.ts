import { expect } from "@playwright/test";
import {
  EXPECTED_DISCONNECT_TODAY_USAGE_COLUMNS,
  commandsDisconnectTodayUsageData,
} from "../Data/commands-disconnect-today-usage.data";
import {
  DisconnectTodayUsageResponse,
  MappedDisconnectTodayUsageData,
} from "../Mapper/commands-disconnect-today-usage.mapper";

export class CommandsDisconnectTodayUsageValidator {
  validateResponse(body: DisconnectTodayUsageResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  }

  validateErrorResponse(body: DisconnectTodayUsageResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateDataKeys(data: object): void {
    expect(Object.keys(data).sort()).toEqual([...EXPECTED_DISCONNECT_TODAY_USAGE_COLUMNS].sort());
  }

  validateDate(mapped: MappedDisconnectTodayUsageData): void {
    expect(commandsDisconnectTodayUsageData.datePattern.test(mapped.date)).toBe(true);
  }

  validateTimezone(mapped: MappedDisconnectTodayUsageData): void {
    expect(mapped.timezone).toBe(commandsDisconnectTodayUsageData.expectedTimezone);
  }

  validateQuotaCounts(mapped: MappedDisconnectTodayUsageData): void {
    for (const value of [
      mapped.limit,
      mapped.used,
      mapped.remaining,
      mapped.disconnectedMeters,
      mapped.successfulDisconnectAttempts,
      mapped.uniqueDisconnectMeters,
    ]) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }

    expect(mapped.used + mapped.remaining).toBe(mapped.limit);
    expect(mapped.used).toBeLessThanOrEqual(mapped.limit);
    expect(mapped.remaining).toBeLessThanOrEqual(mapped.limit);
    expect(mapped.disconnectedMeters).toBeLessThanOrEqual(mapped.limit);
    expect(mapped.successfulDisconnectAttempts).toBeLessThanOrEqual(mapped.limit);
    expect(mapped.uniqueDisconnectMeters).toBeLessThanOrEqual(mapped.limit);
  }

  validateFullContract(mapped: MappedDisconnectTodayUsageData, rawData?: object): void {
    if (rawData) {
      this.validateDataKeys(rawData);
    }
    this.validateDate(mapped);
    this.validateTimezone(mapped);
    this.validateQuotaCounts(mapped);
  }
}
