import { expect } from "@playwright/test";
import { EXPECTED_PING_METER_RESPONSE_COLUMNS, commandsPingData } from "../Data/commands-ping.data";
import {
  MappedPingData,
  PingData,
  PingMeterResult,
  PingResponse,
  PingSummary,
} from "../Mapper/commands-ping.mapper";

const JOB_NAME_PATTERN = /^\d+$/;

export class CommandsPingValidator {
  validateResponse(body: PingResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.message).toBeTruthy();
  }

  validateErrorResponse(body: PingResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateSuccessMessage(message: string): void {
    expect(commandsPingData.successMessagePattern.test(message)).toBe(true);
  }

  validateSummaryCounts(summary: PingSummary): void {
    for (const value of [
      summary.requested,
      summary.duplicatesRemoved,
      summary.successful,
      summary.failed,
      summary.rejectedOutOfScope,
      summary.rejectedUnknown,
      summary.batchesProcessed,
    ]) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }

    expect(summary.successful).toBeLessThanOrEqual(summary.requested);
    expect(summary.failed).toBeLessThanOrEqual(summary.requested);

    const accounted =
      summary.successful + summary.failed + summary.rejectedOutOfScope + summary.rejectedUnknown;
    expect(accounted).toBeLessThanOrEqual(summary.requested);
    expect(summary.batchesProcessed).toBeGreaterThan(0);
  }

  validateSuccessfulMeters(ping: PingData, requestedMeters: string[]): void {
    expect(ping.successfulMeters.length).toBe(ping.summary.successful);
    for (const meterId of ping.successfulMeters) {
      expect(/^\d+$/.test(meterId)).toBe(true);
      expect(requestedMeters).toContain(meterId);
    }
  }

  validateRejectedMeters(ping: PingData): void {
    const rejectedCount = ping.summary.rejectedOutOfScope + ping.summary.rejectedUnknown;
    expect(ping.rejectedMeters.length).toBeLessThanOrEqual(rejectedCount);
    for (const meterId of ping.rejectedMeters) {
      expect(/^\d+$/.test(meterId)).toBe(true);
      expect(ping.successfulMeters).not.toContain(meterId);
    }
  }

  validateEnvelope(ping: PingData): void {
    expect(ping.hesCallbackConfigured).toBe(true);
    expect(Array.isArray(ping.meterResults)).toBe(true);
    expect(Array.isArray(ping.meterStatuses)).toBe(true);
    expect(Array.isArray(ping.successfulMeters)).toBe(true);
    expect(Array.isArray(ping.rejectedMeters)).toBe(true);
  }

  validateSyncTimings(ping: PingData): void {
    expect(ping.commandExecutionTimeMs).not.toBeNull();
    expect(ping.meterResponseTimeMs).not.toBeNull();
    expect(ping.commandExecutionTimeMs!).toBeGreaterThan(0);
    expect(ping.meterResponseTimeMs!).toBeGreaterThan(0);
  }

  validateDisplayColumns(row: PingMeterResult): void {
    const labels = row.meterResponseRows.map((r) => r.label);
    expect(labels).toEqual([...EXPECTED_PING_METER_RESPONSE_COLUMNS]);
  }

  validateSuccessMeterResult(row: PingMeterResult, expectedMeterId: string): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.status).toBe("SUCCESS");
    expect(row.result).toBe("SUCCESS");
    expect(row.jobStatus).toBe("SUCCESS");
    expect(JOB_NAME_PATTERN.test(row.jobName)).toBe(true);
    expect(row.hesStatusCode).toBe(200);
    expect(row.errorMessage ?? null).toBeNull();

    expect(row.state).toBeTruthy();
    expect(
      commandsPingData.expectedStates.includes(
        row.state as (typeof commandsPingData.expectedStates)[number],
      ) || /^[A-Z][A-Z0-9_]*$/.test(row.state!),
    ).toBe(true);

    expect(row.communicationStatus).toBeTruthy();
    expect(row.meterResponse).toBeTruthy();
    expect(row.meterResponseRows.length).toBeGreaterThan(0);
    this.validateDisplayColumns(row);

    const stateRow = row.meterResponseRows.find((r) => r.label === "State");
    expect(stateRow).toBeDefined();
    expect(stateRow!.value.length).toBeGreaterThan(0);
    expect(stateRow!.value.toLowerCase()).toBe(
      (row.communicationStatus ?? row.meterResponse ?? "").toLowerCase(),
    );

    if (row.response) {
      if (row.response.meterId != null) {
        expect(row.response.meterId).toBe(expectedMeterId);
      }
      if (row.response.state != null) {
        expect(row.response.state).toBe(row.state);
      }
    }

    expect(row.commandExecutionTimeMs).not.toBeNull();
    expect(row.meterResponseTimeMs).not.toBeNull();
    expect(row.commandExecutionTimeMs!).toBeGreaterThan(0);
    expect(row.meterResponseTimeMs!).toBeGreaterThan(0);
  }

  validateFailedMeterResult(row: PingMeterResult, expectedMeterId: string): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.status).toBe("FAILED");
    expect(JOB_NAME_PATTERN.test(row.jobName)).toBe(true);
    expect(row.hesStatusCode).toBeGreaterThanOrEqual(0);
    const detail = row.errorMessage ?? row.meterResponse ?? "";
    expect(detail.trim().length).toBeGreaterThan(0);
  }

  isTransientMeterFailure(row: PingMeterResult): boolean {
    const detail = `${row.errorMessage ?? ""} ${row.meterResponse ?? ""} ${row.communicationStatus ?? ""}`;
    return commandsPingData.transientMeterFailurePattern.test(detail);
  }

  validateMeterStatuses(ping: PingData, expectedMeterId: string): void {
    const match = ping.meterStatuses.find((s) => s.meterId === expectedMeterId);
    expect(match, `Expected meterStatuses entry for ${expectedMeterId}`).toBeDefined();
    expect(match!.state.trim().length).toBeGreaterThan(0);

    const result = ping.meterResults.find((r) => r.meterId === expectedMeterId);
    if (result?.state) {
      expect(match!.state).toBe(result.state);
    }
  }

  validateFullSuccessContract(mapped: MappedPingData, expectedMeterId: string): void {
    this.validateSuccessMessage(mapped.message);
    this.validateSummaryCounts(mapped.ping.summary);
    this.validateEnvelope(mapped.ping);
    this.validateSyncTimings(mapped.ping);
    this.validateSuccessfulMeters(mapped.ping, [expectedMeterId]);
    this.validateRejectedMeters(mapped.ping);

    const row = mapped.ping.meterResults.find((r) => r.meterId === expectedMeterId);
    expect(row, `Expected meter ${expectedMeterId} in ping results`).toBeDefined();
    this.validateSuccessMeterResult(row!, expectedMeterId);
    this.validateMeterStatuses(mapped.ping, expectedMeterId);
  }
}
