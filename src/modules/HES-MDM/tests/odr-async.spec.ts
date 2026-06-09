import { expect } from "@playwright/test";
import { test, isHesConfigured } from "../../../fixtures/hes.fixture";
import { MeterJobApi } from "../Api/meterjob.api";
import {
  buildOdrJobInvalidObis,
  buildOdrJobMissingStartTime,
  buildOdrJobMissingStopTime,
  buildOdrJobRangeExceedsThreeDays,
  buildOdrJobStartAfterStop,
  buildInstantaneousOdrJob,
  buildValidOdrAsyncJob
} from "../Data/odr.data";
import { hesMeterJobData } from "../Data/meterjob.data";
import { MeterJobMapper } from "../Mapper/meterjob.mapper";
import { MeterJobValidator } from "../Validator/meterjob.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("HES ODR Async API", () => {
  test.beforeEach(() => {
    test.skip(!isHesConfigured(), "HES_BASE_URL not configured");
  });

  test(
    "valid ODR async job",
    { tag: ["@hes", "@odr", "@async", "@smoke", "@phase1"] },
    async ({ hesApi }) => {
      const payload = buildValidOdrAsyncJob();
      const api = new MeterJobApi(hesApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();
      const validator = new MeterJobValidator();

      validation.execute("ODR Command", () =>
        validator.validateOdrCommand(payload.jobConfiguration.commands[0])
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

      validation.printSummary("ODR Async — valid", result.responseTime);
    }
  );

  test(
    "instantaneous profile ODR — §4.1 / V1.5",
    { tag: ["@hes", "@odr", "@async", "@instantaneous", "@phase1"] },
    async ({ hesApi }) => {
      const payload = buildInstantaneousOdrJob();
      const api = new MeterJobApi(hesApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();
      const validator = new MeterJobValidator();

      validation.execute("ODR Command", () =>
        validator.validateOdrCommand(payload.jobConfiguration.commands[0])
      );
      validation.execute("Request Structure", () =>
        validator.validateRequestStructure(payload)
      );

      const result = await api.createJob(payload);

      validation.execute("Status", () =>
        assert.validateStatusCode(
          result.rawResponse,
          hesMeterJobData.expectedCreatedStatus,
          result.responseBody
        )
      );

      validation.printSummary("ODR Async — instantaneous", result.responseTime);
    }
  );

  const negativeCases = [
    { label: "invalid OBIS code", build: buildOdrJobInvalidObis },
    { label: "missing start time", build: buildOdrJobMissingStartTime },
    { label: "missing stop time", build: buildOdrJobMissingStopTime },
    { label: "start after stop", build: buildOdrJobStartAfterStop },
    { label: "range exceeds 3 days", build: buildOdrJobRangeExceedsThreeDays }
  ] as const;

  negativeCases.forEach(({ label, build }) => {
    test(
      `negative — ${label}`,
      { tag: ["@hes", "@odr", "@async", "@negative", "@phase1"] },
      async ({ hesApi }) => {
        const payload = build();
        const api = new MeterJobApi(hesApi);
        const result = await api.createJob(payload);

        const status = result.rawResponse.status();
        expect(status).toBeGreaterThanOrEqual(400);
        expect(status).toBeLessThan(600);
      }
    );
  });
});
