import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { commandsProfileConfigData } from "../Data/commands-profile-config.data";
import { MappedCommandJobInitData } from "../shared/commands-job-init.mapper";

export interface ProfileCapturePeriodEntry {
  type: string;
  profileType: string;
  capturePeriod: number;
  active: boolean;
}

export class CommandsProfileConfigValidator {
  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(/profile period/i.test(mapped.message)).toBe(true);
    expect(/hes callback/i.test(mapped.message)).toBe(true);
  }

  validateInitInProgressStatus(mapped: MappedCommandJobInitData): void {
    for (const row of mapped.init.meterResults) {
      expect(row.status).toBe("IN_PROGRESS");
      expect(row.hesStatusCode).toBe(200);
    }
  }

  validateQueryFinishedMessage(message: string): void {
    expect(/job finished|synced from meterStatusForJob/i.test(message)).toBe(
      true,
    );
  }

  validateProfileCapturePeriodEntry(entry: ProfileCapturePeriodEntry): void {
    expect(entry.type).toBe(commandsProfileConfigData.expectedHesResponseType);
    expect(entry.profileType.trim().length).toBeGreaterThan(0);
    expect(
      commandsProfileConfigData.profileTypes.includes(
        entry.profileType as (typeof commandsProfileConfigData.profileTypes)[number],
      ),
    ).toBe(true);
    expect(Number.isInteger(entry.capturePeriod)).toBe(true);
    expect(entry.capturePeriod).toBeGreaterThan(0);
    expect(typeof entry.active).toBe("boolean");
  }

  validateProfileCapturePeriodResponse(response: unknown[]): void {
    expect(response.length).toBeGreaterThan(0);

    const entries = response as ProfileCapturePeriodEntry[];
    const profileTypes = new Set<string>();

    for (const entry of entries) {
      this.validateProfileCapturePeriodEntry(entry);
      profileTypes.add(entry.profileType);
    }

    expect(profileTypes.size).toBe(entries.length);
  }

  validateProfileConfigMeterResultRow(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBe(commandsProfileConfigData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.hesResponse).toBeDefined();

    const hes = row.hesResponse as Record<string, unknown>;
    expect(hes.meterId).toBe(row.meterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");

    const response = hes.response;
    expect(Array.isArray(response)).toBe(true);
    this.validateProfileCapturePeriodResponse(response as unknown[]);
  }

  validateProfileConfigQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateProfileConfigMeterResultRow(row!);
  }
}
