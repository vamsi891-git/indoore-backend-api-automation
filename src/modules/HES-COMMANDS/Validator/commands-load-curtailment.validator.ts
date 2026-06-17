import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { commandsLoadCurtailmentData } from "../Data/commands-load-curtailment.data";
import { MappedCommandJobInitData } from "../shared/commands-job-init.mapper";

export interface LoadCurtailmentEntry {
  type: string;
  active: boolean;
  powerLimitNormal: number;
  currentLimitNormal: number;
  lockoutMaxCounter: number;
  loadCurtailmentState: string;
  alertPeriod: number;
  lockoutPeriod: number;
}

export class CommandsLoadCurtailmentValidator {
  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(/load curtailment/i.test(mapped.message)).toBe(true);
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

  validateLoadCurtailmentEntry(entry: LoadCurtailmentEntry): void {
    expect(entry.type).toBe(commandsLoadCurtailmentData.expectedHesResponseType);
    expect(typeof entry.active).toBe("boolean");

    expect(Number.isFinite(entry.powerLimitNormal)).toBe(true);
    expect(entry.powerLimitNormal).toBeGreaterThan(0);

    expect(Number.isFinite(entry.currentLimitNormal)).toBe(true);
    expect(entry.currentLimitNormal).toBeGreaterThan(0);

    expect(Number.isInteger(entry.lockoutMaxCounter)).toBe(true);
    expect(entry.lockoutMaxCounter).toBeGreaterThan(0);

    expect(entry.loadCurtailmentState.trim().length).toBeGreaterThan(0);
    expect(
      commandsLoadCurtailmentData.loadCurtailmentStates.includes(
        entry.loadCurtailmentState as (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number],
      ),
    ).toBe(true);

    expect(Number.isInteger(entry.alertPeriod)).toBe(true);
    expect(entry.alertPeriod).toBeGreaterThan(0);

    expect(Number.isInteger(entry.lockoutPeriod)).toBe(true);
    expect(entry.lockoutPeriod).toBeGreaterThan(0);
  }

  validateLoadCurtailmentResponse(response: unknown[]): void {
    expect(response.length).toBeGreaterThan(0);

    const entries = response as LoadCurtailmentEntry[];
    const loadCurtailment = entries.find(
      (e) => e.type === commandsLoadCurtailmentData.expectedHesResponseType,
    );
    expect(loadCurtailment).toBeDefined();
    this.validateLoadCurtailmentEntry(loadCurtailment!);
  }

  validateLoadCurtailmentMeterResultRow(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBe(commandsLoadCurtailmentData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.hesResponse).toBeDefined();

    const hes = row.hesResponse as Record<string, unknown>;
    expect(hes.meterId).toBe(row.meterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");

    const response = hes.response;
    expect(Array.isArray(response)).toBe(true);
    this.validateLoadCurtailmentResponse(response as unknown[]);
  }

  validateLoadCurtailmentQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateLoadCurtailmentMeterResultRow(row!);
  }
}
