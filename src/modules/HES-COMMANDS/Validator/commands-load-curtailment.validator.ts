import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import {
  commandsLoadCurtailmentData,
  LoadCurtailmentSetFields,
} from "../Data/commands-load-curtailment.data";
import { MappedCommandJobInitData } from "../shared/commands-job-init.mapper";
import { QUERY_FINISHED_MESSAGE } from "../utils/commands-job-e2e.helper";

export interface LoadCurtailmentEntry {
  type: string;
  active: boolean;
  powerLimitNormal: number;
  currentLimitNormal: number;
  lockoutMaxCounter: number;
  currentLoadLimitStatus?: string;
  powerLoadLimitStatus?: string;
  loadCurtailmentState: string;
  alertPeriod: number;
  lockoutPeriod: number;
  powerLimitEmergency?: number;
  powerLimitMinOverThresholdDuration?: number;
  powerLimitMinUnderThresholdDuration?: number;
  currentLimitEmergency?: number;
  currentLimitMinOverThresholdDuration?: number;
  currentLimitMinUnderThresholdDuration?: number;
}

const STATUS_LABELS = [
  "Current Load Limit Status",
  "Power Load Limit Status",
  "Load Curtailment State",
] as const;

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

  /** Async init: execution timings stay null until HES callback finishes. */
  validateInitAsyncTimings(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.commandExecutionTimeMs).toBeNull();
    expect(mapped.init.meterResponseTimeMs).toBeNull();
  }

  validateQueryFinishedMessage(message: string): void {
    expect(QUERY_FINISHED_MESSAGE.test(message)).toBe(true);
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

    for (const statusField of ["currentLoadLimitStatus", "powerLoadLimitStatus"] as const) {
      const value = entry[statusField];
      if (value != null) {
        expect(
          commandsLoadCurtailmentData.loadCurtailmentStates.includes(
            String(
              value,
            ).toUpperCase() as (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number],
          ),
        ).toBe(true);
      }
    }
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

  validateDisplayRowsMatchEntry(
    rows: { label: string; value: string }[],
    entry: LoadCurtailmentEntry,
  ): void {
    for (const label of commandsLoadCurtailmentData.expectedDisplayLabels) {
      const row = rows.find((r) => r.label === label);
      expect(row, `Missing meterResponseRows label "${label}"`).toBeDefined();
      expect(row!.value.length).toBeGreaterThan(0);
    }

    expect(rows.find((r) => r.label === "Power Limit Normal")!.value).toBe(
      String(entry.powerLimitNormal),
    );
    expect(rows.find((r) => r.label === "Current Limit Normal")!.value).toBe(
      String(entry.currentLimitNormal),
    );
    expect(rows.find((r) => r.label === "Lockout Max Counter")!.value).toBe(
      String(entry.lockoutMaxCounter),
    );
    expect(rows.find((r) => r.label === "Alert Period")!.value).toBe(String(entry.alertPeriod));
    expect(rows.find((r) => r.label === "Lockout Period")!.value).toBe(String(entry.lockoutPeriod));

    expect(rows.find((r) => r.label === "Load Curtailment State")!.value.toUpperCase()).toBe(
      entry.loadCurtailmentState.toUpperCase(),
    );

    for (const label of STATUS_LABELS) {
      if (label === "Load Curtailment State") continue;
      const display = rows.find((r) => r.label === label)!.value.toUpperCase();
      expect(
        commandsLoadCurtailmentData.loadCurtailmentStates.includes(
          display as (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number],
        ),
      ).toBe(true);
    }
  }

  /** Build SET payload from a FINISHED GET hesResponse entry (keeps live limits). */
  extractSetFieldsFromEntry(entry: LoadCurtailmentEntry): LoadCurtailmentSetFields {
    const state = String(entry.loadCurtailmentState).toUpperCase();
    expect(
      commandsLoadCurtailmentData.loadCurtailmentStates.includes(
        state as (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number],
      ),
    ).toBe(true);

    return {
      loadCurtailmentState:
        state as (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number],
      powerLimitNormal: Number(entry.powerLimitNormal),
      powerLimitEmergency: Number(entry.powerLimitEmergency ?? 0),
      powerLimitMinOverThresholdDuration: Number(entry.powerLimitMinOverThresholdDuration ?? 0),
      powerLimitMinUnderThresholdDuration: Number(entry.powerLimitMinUnderThresholdDuration ?? 0),
      currentLimitNormal: Number(entry.currentLimitNormal),
      currentLimitEmergency: Number(entry.currentLimitEmergency ?? 0),
      currentLimitMinOverThresholdDuration: Number(entry.currentLimitMinOverThresholdDuration ?? 0),
      currentLimitMinUnderThresholdDuration: Number(
        entry.currentLimitMinUnderThresholdDuration ?? 0,
      ),
      alertPeriod: Number(entry.alertPeriod),
      lockoutPeriod: Number(entry.lockoutPeriod),
      lockoutMaxCounter: Number(entry.lockoutMaxCounter),
    };
  }

  extractEntryFromMeterResult(row: QueryMeterJobMeterResult): LoadCurtailmentEntry {
    const hes = row.hesResponse as Record<string, unknown>;
    const response = hes.response as LoadCurtailmentEntry[];
    const entry = response.find(
      (e) => e.type === commandsLoadCurtailmentData.expectedHesResponseType,
    );
    expect(entry).toBeDefined();
    return entry!;
  }

  validateLoadCurtailmentMeterResultRow(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBe(commandsLoadCurtailmentData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.hesResponse).toBeDefined();
    expect(row.message).toBeTruthy();
    expect(/load curtailment/i.test(row.message!)).toBe(true);
    expect(row.reason).toBeNull();

    expect(row.meterResponse).toBeTruthy();
    expect(row.meterResponseRows?.length).toBeGreaterThan(0);
    for (const item of row.meterResponseRows ?? []) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.value.length).toBeGreaterThan(0);
    }

    const hes = row.hesResponse as Record<string, unknown>;
    expect(hes.meterId).toBe(row.meterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");

    const response = hes.response;
    expect(Array.isArray(response)).toBe(true);
    this.validateLoadCurtailmentResponse(response as unknown[]);

    const entry = this.extractEntryFromMeterResult(row);
    this.validateDisplayRowsMatchEntry(row.meterResponseRows ?? [], entry);

    const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
    expect(meta).toBeDefined();
    expect(meta!.commandApiType).toBe("load_curtailment_get");
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

  validateLoadCurtailmentQueryMeterResults(
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
    this.validateLoadCurtailmentMeterResultRow(row!);

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
