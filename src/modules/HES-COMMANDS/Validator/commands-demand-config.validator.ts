import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { commandsDemandConfigData } from "../Data/commands-demand-config.data";
import { MappedCommandJobInitData } from "../shared/commands-job-init.mapper";

export interface DemandIntegrationPeriodEntry {
  type: string;
  demandPeriod: number;
  active: boolean;
}

export class CommandsDemandConfigValidator {
  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(/demand period/i.test(mapped.message)).toBe(true);
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

  validateDemandIntegrationPeriodEntry(
    entry: DemandIntegrationPeriodEntry,
  ): void {
    expect(entry.type).toBe(commandsDemandConfigData.expectedHesResponseType);
    expect(Number.isInteger(entry.demandPeriod)).toBe(true);
    expect(entry.demandPeriod).toBeGreaterThan(0);
    expect(typeof entry.active).toBe("boolean");
  }

  validateDemandIntegrationPeriodResponse(response: unknown[]): void {
    expect(response.length).toBeGreaterThan(0);

    for (const item of response) {
      this.validateDemandIntegrationPeriodEntry(
        item as DemandIntegrationPeriodEntry,
      );
    }
  }

  validateDemandConfigMeterResultRow(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBe(commandsDemandConfigData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.hesResponse).toBeDefined();

    const hes = row.hesResponse as Record<string, unknown>;
    expect(hes.meterId).toBe(row.meterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");

    const response = hes.response;
    expect(Array.isArray(response)).toBe(true);
    this.validateDemandIntegrationPeriodResponse(response as unknown[]);
  }

  validateDemandConfigQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateDemandConfigMeterResultRow(row!);
  }
}
