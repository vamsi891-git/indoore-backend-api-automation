import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { commandsDemandConfigData } from "../Data/commands-demand-config.data";
import { MappedCommandJobInitData } from "../shared/commands-job-init.mapper";
import { QUERY_FINISHED_MESSAGE } from "../utils/commands-job-e2e.helper";

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

  /** Async init: execution timings stay null until HES callback finishes. */
  validateInitAsyncTimings(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.commandExecutionTimeMs).toBeNull();
    expect(mapped.init.meterResponseTimeMs).toBeNull();
  }

  validateQueryFinishedMessage(message: string): void {
    expect(QUERY_FINISHED_MESSAGE.test(message)).toBe(true);
  }

  validateDemandIntegrationPeriodEntry(entry: DemandIntegrationPeriodEntry): void {
    expect(entry.type).toBe(commandsDemandConfigData.expectedHesResponseType);
    expect(Number.isInteger(entry.demandPeriod)).toBe(true);
    expect(entry.demandPeriod).toBeGreaterThan(0);
    expect(typeof entry.active).toBe("boolean");
  }

  validateDemandIntegrationPeriodResponse(response: unknown[]): void {
    expect(response.length).toBeGreaterThan(0);

    for (const item of response) {
      this.validateDemandIntegrationPeriodEntry(item as DemandIntegrationPeriodEntry);
    }
  }

  validateDemandConfigMeterResultRow(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBe(commandsDemandConfigData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.hesResponse).toBeDefined();
    expect(row.message).toBeTruthy();
    expect(/demand period/i.test(row.message!)).toBe(true);
    expect(row.reason).toBeNull();

    expect(row.meterResponse).toBeTruthy();
    expect(row.meterResponseRows?.length).toBeGreaterThan(0);
    for (const item of row.meterResponseRows ?? []) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.value.length).toBeGreaterThan(0);
    }

    const demandRow = row.meterResponseRows?.find((r) => /demand period/i.test(r.label));
    expect(demandRow).toBeDefined();
    expect(/^\d+$/.test(demandRow!.value)).toBe(true);

    const hes = row.hesResponse as Record<string, unknown>;
    expect(hes.meterId).toBe(row.meterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");

    const response = hes.response;
    expect(Array.isArray(response)).toBe(true);
    this.validateDemandIntegrationPeriodResponse(response as unknown[]);

    const demandEntry = (response as DemandIntegrationPeriodEntry[]).find(
      (item) => item.type === commandsDemandConfigData.expectedHesResponseType,
    );
    expect(demandEntry).toBeDefined();
    expect(String(demandEntry!.demandPeriod)).toBe(demandRow!.value);

    const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
    expect(meta).toBeDefined();
    expect(meta!.commandApiType).toBe("demand_integration_period_get");
    expect(typeof meta!.publicRequestId).toBe("string");
    expect(/^\d+$/.test(String(meta!.publicRequestId))).toBe(true);

    const startedMs = Date.parse(String(meta!.startedAt));
    const completedMs = Date.parse(String(meta!.completedAt));
    expect(Number.isFinite(startedMs)).toBe(true);
    expect(Number.isFinite(completedMs)).toBe(true);
    expect(completedMs).toBeGreaterThanOrEqual(startedMs);
    expect(Number(meta!.executionDurationMs)).toBeGreaterThanOrEqual(0);

    if (meta!.commandData != null) {
      expect(typeof meta!.commandData).toBe("object");
    }
  }

  validateDemandConfigQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
    jobLevel?: {
      meterResponse?: string | null;
      meterResponseRows?: { label: string; value: string }[];
      message?: string | null;
    },
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateDemandConfigMeterResultRow(row!);

    if (jobLevel?.meterResponse != null) {
      expect(jobLevel.meterResponse).toBe(row!.meterResponse);
    }
    if (jobLevel?.meterResponseRows != null) {
      expect(jobLevel.meterResponseRows).toEqual(row!.meterResponseRows);
    }
    if (jobLevel?.message != null) {
      expect(jobLevel.message).toBe(row!.message);
    }
  }
}
