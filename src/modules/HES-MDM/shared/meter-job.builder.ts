import { defaultJobTimeoutTime } from "./hes-datetime.util";
import {
  MeterCommand,
  MeterJobCallbackType,
  MeterJobRequest,
  MeterJobType
} from "./meter-job.types";

/** §3 — jobName must be unique; "." is not allowed; "_" is recommended */
export function createJobName(prefix: string): string {
  const safe = prefix.replace(/\./g, "_").replace(/-/g, "_");
  return `${safe}_${Date.now()}`;
}

function defaultCallbackUrl(): string {
  return process.env.HES_CALLBACK_URL ?? "https://example.com/hes/callback";
}

function defaultMeterId(): string {
  return process.env.HES_TEST_METER_ID ?? "TEST_METER_001";
}

export class MeterJobBuilder {
  private payload: MeterJobRequest;

  private constructor(seed?: Partial<MeterJobRequest>) {
    this.payload = {
      jobConfiguration: { commands: [] },
      jobType: "METER_ACTION",
      jobName: createJobName("auto_job"),
      meters: [defaultMeterId()],
      startJob: true,
      timeoutTime: defaultJobTimeoutTime(),
      callback: {
        callbackOn: ["JOB_METER_CALLBACK"],
        callbackUrl: defaultCallbackUrl()
      },
      ...seed
    };
  }

  static create(): MeterJobBuilder {
    return new MeterJobBuilder();
  }

  static fromRequest(request: MeterJobRequest): MeterJobBuilder {
    return new MeterJobBuilder(structuredClone(request));
  }

  withJobType(jobType: MeterJobType | string): this {
    this.payload.jobType = jobType;
    return this;
  }

  withJobName(jobName: string): this {
    this.payload.jobName = jobName;
    return this;
  }

  withMeter(meterId: string): this {
    this.payload.meters = [meterId];
    return this;
  }

  withMeters(meters: string[]): this {
    this.payload.meters = meters;
    return this;
  }

  withStartJob(startJob: boolean): this {
    this.payload.startJob = startJob;
    return this;
  }

  withTimeout(timeoutTime: string): this {
    this.payload.timeoutTime = timeoutTime;
    return this;
  }

  withCallback(
    callbackUrl: string,
    callbackOn: MeterJobCallbackType[] = ["JOB_METER_CALLBACK"]
  ): this {
    this.payload.callback = { callbackUrl, callbackOn };
    return this;
  }

  withCommand(command: MeterCommand): this {
    this.payload.jobConfiguration.commands = [command];
    return this;
  }

  withCommands(commands: MeterCommand[]): this {
    this.payload.jobConfiguration.commands = commands;
    return this;
  }

  /** §3.2 — GET operations require `active` */
  withGetCommand(
    type: MeterCommand["type"],
    active = true,
    extra: Record<string, unknown> = {}
  ): this {
    return this.withCommand({
      type,
      active,
      ...extra
    } as MeterCommand);
  }

  withoutJobType(): Record<string, unknown> {
    const { jobType: _removed, ...rest } = this.payload;
    return rest;
  }

  withEmptyJobType(): this {
    this.payload.jobType = "";
    return this;
  }

  withInvalidJobNameDot(): this {
    this.payload.jobName = `invalid.name.${Date.now()}`;
    return this;
  }

  build(): MeterJobRequest {
    return structuredClone(this.payload);
  }
}
