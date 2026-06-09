import { expect } from "@playwright/test";
import { test, isHesConfigured } from "../../../fixtures/hes.fixture";
import { MeterJobApi } from "../Api/meterjob.api";
import {
  hesMeterJobData,
  invalidJobTypeCases,
  validJobTypes,
  buildPingJob
} from "../Data/meterjob.data";
import { MeterJobMapper } from "../Mapper/meterjob.mapper";
import { MeterJobValidator } from "../Validator/meterjob.validator";
import { createJobName, MeterJobBuilder } from "../shared/meter-job.builder";
import { MeterJobType } from "../shared/meter-job.types";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

function buildPayloadForJobType(jobType: MeterJobType) {
  const builder = MeterJobBuilder.create()
    .withJobType(jobType)
    .withJobName(createJobName(`valid_${jobType}`));

  switch (jobType) {
    case "METER_COMMAND_GET":
      return builder.withGetCommand("DISCONNECTOR_CONTROL").build();
    case "METER_COMMAND_SET":
      return builder
        .withCommand({ type: "DISCONNECTOR_CONTROL", controlRequest: "CONNECT" })
        .build();
    case "METER_ACTION":
      return builder.withCommand({ type: "PING" }).build();
    case "METER_FIRMWARE_UPGRADE":
      return builder.withCommand({ type: "PING" }).build();
  }
}

test.describe("HES Meter Job API", () => {
  test.beforeEach(() => {
    test.skip(!isHesConfigured(), "HES_BASE_URL not configured");
  });

  validJobTypes.forEach((jobType) => {
    test(
      `valid jobType — ${jobType}`,
      { tag: ["@hes", "@meter-job", "@smoke", "@phase1"] },
      async ({ hesApi }) => {
        const payload = buildPayloadForJobType(jobType);
        const api = new MeterJobApi(hesApi);
        const validator = new MeterJobValidator();
        const validation = new ValidationEngine();
        const assert = new AssertionEngine();

        validation.execute("Request Structure", () =>
          validator.validateRequestStructure(payload)
        );
        validation.execute("Callback Config", () =>
          validator.validateCallbackConfig(payload)
        );
        validation.execute("GET active flag", () =>
          validator.validateGetCommandActiveFlag(payload)
        );

        const result = await api.createJob(payload);

        validation.execute("Status", () =>
          assert.validateStatusCode(
            result.rawResponse,
            hesMeterJobData.expectedCreatedStatus,
            result.responseBody
          )
        );

        const mapped = MeterJobMapper.mapCreateResponse(result.responseBody);
        validation.execute("Created Job", () =>
          validator.validateCreatedJob(mapped, payload.jobName)
        );
        validation.execute("Job Summary", () =>
          validator.validateJobSummary(mapped, payload.jobName)
        );

        validation.printSummary(`Meter Job API — ${jobType}`, result.responseTime);
      }
    );
  });

  invalidJobTypeCases.forEach(({ label, jobType }) => {
    test(
      `negative — ${label}`,
      { tag: ["@hes", "@meter-job", "@negative", "@phase1"] },
      async ({ hesApi }) => {
        const payload = MeterJobBuilder.create()
          .withJobType(jobType)
          .withJobName(createJobName("negative"))
          .withCommand({ type: "PING" })
          .build();

        const api = new MeterJobApi(hesApi);
        const result = await api.createJob(payload);

        const status = result.rawResponse.status();
        expect(status).toBeGreaterThanOrEqual(400);
        expect(status).toBeLessThan(500);
      }
    );
  });

  test(
    "negative — missing jobType",
    { tag: ["@hes", "@meter-job", "@negative", "@phase1"] },
    async ({ hesApi }) => {
      const builder = MeterJobBuilder.create()
        .withJobName(createJobName("missing_type"))
        .withCommand({ type: "PING" });

      const api = new MeterJobApi(hesApi);
      const result = await api.createJob(builder.withoutJobType());

      const status = result.rawResponse.status();
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    }
  );

  test(
    "negative — jobName contains dot",
    { tag: ["@hes", "@meter-job", "@negative", "@phase1"] },
    async ({ hesApi }) => {
      const payload = MeterJobBuilder.create()
        .withInvalidJobNameDot()
        .withCommand({ type: "PING" })
        .build();

      const validator = new MeterJobValidator();
      expect(() => validator.validateRequestStructure(payload)).toThrow();

      const api = new MeterJobApi(hesApi);
      const result = await api.createJob(payload);
      expect(result.rawResponse.status()).toBeGreaterThanOrEqual(400);
    }
  );

  test(
    "callback config — JOB_METER_CALLBACK default and JOB_CALLBACK",
    { tag: ["@hes", "@meter-job", "@callback", "@phase1"] },
    async ({ hesApi }) => {
      const payload = MeterJobBuilder.create()
        .withJobName(createJobName("callback"))
        .withCallback(process.env.HES_CALLBACK_URL ?? "https://example.com/hes/callback", [
          "JOB_METER_CALLBACK",
          "JOB_CALLBACK"
        ])
        .withCommand({ type: "PING" })
        .build();

      const api = new MeterJobApi(hesApi);
      const validator = new MeterJobValidator();
      const validation = new ValidationEngine();

      validation.execute("Callback Config", () =>
        validator.validateCallbackConfig(payload)
      );
      validation.execute("Request Structure", () =>
        validator.validateRequestStructure(payload)
      );

      const result = await api.createJob(payload);
      expect([201, 400, 422]).toContain(result.rawResponse.status());

      validation.printSummary("Meter Job Callback Config", result.responseTime);
    }
  );

  test(
    "ping command via meterJob",
    { tag: ["@hes", "@meter-job", "@ping", "@smoke", "@phase1"] },
    async ({ hesApi }) => {
      const payload = buildPingJob();
      const api = new MeterJobApi(hesApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();
      const validator = new MeterJobValidator();

      const result = await api.createJob(payload);

      validation.execute("Status", () =>
        assert.validateStatusCode(
          result.rawResponse,
          hesMeterJobData.expectedCreatedStatus,
          result.responseBody
        )
      );
      validation.execute("Request Structure", () =>
        validator.validateRequestStructure(payload)
      );

      const mapped = MeterJobMapper.mapCreateResponse(result.responseBody);
      validation.execute("Created Job", () =>
        validator.validateCreatedJob(mapped, payload.jobName)
      );

      validation.printSummary("Meter Job Ping", result.responseTime);
    }
  );
});
