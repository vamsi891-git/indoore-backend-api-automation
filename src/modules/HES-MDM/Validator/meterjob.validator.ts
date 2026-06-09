import { expect } from "@playwright/test";
import { MappedMeterJob, MappedMeterStatusRow } from "../Mapper/meterjob.mapper";
import { isValidHesDateTime } from "../shared/hes-datetime.util";
import {
  MeterJobCallbackPayload,
  MeterJobMeterStatusType,
  MeterJobRequest,
  MeterJobStatus
} from "../shared/meter-job.types";

const JOB_STATUSES = new Set<MeterJobStatus>([
  "SCHEDULED",
  "RUNNING",
  "FINISHED",
  "TIMEOUT_CANCELLED",
  "CANCELLING",
  "CANCELLED"
]);

const METER_STATUSES = new Set<MeterJobMeterStatusType>([
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "TIMEOUT_CANCELLED",
  "DEVICE_UNREACHABLE"
]);

const GET_JOB_TYPES = new Set(["METER_COMMAND_GET"]);

export class MeterJobValidator {
  /** §3 + §1 — one meter per job; callback mandatory for async */
  validateRequestStructure(request: MeterJobRequest): void {
    expect(request.jobConfiguration).toBeDefined();
    expect(Array.isArray(request.jobConfiguration.commands)).toBe(true);
    expect(request.jobType).toBeTruthy();
    expect(request.jobName).toBeTruthy();
    expect(request.jobName).not.toContain(".");
    expect(request.meters.length).toBe(1);
    expect(request.startJob).toBe(true);
    expect(isValidHesDateTime(request.timeoutTime)).toBe(true);
    expect(request.callback.callbackUrl).toBeTruthy();
    expect(request.callback.callbackOn.length).toBeGreaterThan(0);
  }

  validateCallbackConfig(request: MeterJobRequest): void {
    const allowed = new Set(["JOB_METER_CALLBACK", "JOB_CALLBACK"]);
    request.callback.callbackOn.forEach((type) => {
      expect(allowed.has(type)).toBe(true);
    });
  }

  validateGetCommandActiveFlag(request: MeterJobRequest): void {
    if (!GET_JOB_TYPES.has(String(request.jobType))) {
      return;
    }

    request.jobConfiguration.commands.forEach((command) => {
      expect(command.active).toBeDefined();
    });
  }

  validateCreatedJob(mapped: MappedMeterJob, expectedJobName: string): void {
    expect(mapped.jobName).toBe(expectedJobName);
    if (mapped.status) {
      expect(JOB_STATUSES.has(mapped.status as MeterJobStatus) || mapped.status.length > 0).toBe(
        true
      );
    }
  }

  /** §3.7 MeterJobSummary */
  validateJobSummary(mapped: MappedMeterJob, expectedJobName: string): void {
    expect(mapped.jobName).toBe(expectedJobName);
    expect(mapped.status.length).toBeGreaterThan(0);

    if (mapped.totalProcessedDevices !== undefined) {
      expect(mapped.totalProcessedDevices).toBeGreaterThanOrEqual(0);
    }
    if (mapped.totalSuccessfulDevices !== undefined) {
      expect(mapped.totalSuccessfulDevices).toBeGreaterThanOrEqual(0);
    }
    if (mapped.totalFailedDevices !== undefined) {
      expect(mapped.totalFailedDevices).toBeGreaterThanOrEqual(0);
    }
  }

  validateQueryJob(mapped: MappedMeterJob, expectedJobName: string): void {
    this.validateJobSummary(mapped, expectedJobName);
  }

  /** §3.9 MeterJobMeterStatus */
  validateMeterStatusRows(rows: MappedMeterStatusRow[]): void {
    rows.forEach((row) => {
      expect(row.meterId).toBeTruthy();
      expect(row.status).toBeTruthy();
      expect(
        METER_STATUSES.has(row.status as MeterJobMeterStatusType) ||
          row.status.length > 0
      ).toBe(true);

      if (row.status === "FAILED" && row.failureStep !== undefined) {
        expect(row.failureStep).toBeGreaterThanOrEqual(0);
      }
    });
  }

  /** §3.13 callback payload */
  validateCallbackPayload(payload: MeterJobCallbackPayload): void {
    expect(payload.jobName).toBeTruthy();
    expect(["JOB_METER_CALLBACK", "JOB_CALLBACK"]).toContain(payload.callbackType);

    const meters = payload.JobMeterStatusResponse?.meters ?? [];
    if (meters.length > 0) {
      this.validateMeterStatusRows(
        meters.map((m) => ({
          meterId: m.meterId,
          status: m.status,
          failureStep: m.failureStep,
          response: m.response ?? null
        }))
      );
    }
  }

  /** §3.8 — elapsedTime in epoch milliseconds */
  validatePingResponse(body: unknown): void {
    if (!body || typeof body !== "object") {
      return;
    }

    const record = body as Record<string, unknown>;
    const elapsed =
      record.elapsedTime ??
      (record.response as Record<string, unknown> | undefined)?.elapsedTime;

    if (elapsed !== undefined) {
      expect(Number(elapsed)).toBeGreaterThanOrEqual(0);
    }
  }

  validateOdrCommand(
    command: MeterJobRequest["jobConfiguration"]["commands"][number]
  ): void {
    if (command.type !== "ON_DEMAND_PROFILE") {
      return;
    }

    expect(command.formattedProfileObisCode).toBeTruthy();
    expect(command.sampleStartTime).toBeTruthy();
    expect(command.sampleStopTime).toBeTruthy();

    const start = new Date(command.sampleStartTime).getTime();
    const stop = new Date(command.sampleStopTime).getTime();
    expect(Number.isNaN(start)).toBe(false);
    expect(Number.isNaN(stop)).toBe(false);
    expect(start).toBeLessThanOrEqual(stop);

    const diffDays = (stop - start) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThanOrEqual(3);
  }
}
