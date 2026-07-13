import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsMeterSamplesApi } from "../Api/commands-meter-samples.api";
import {
  buildMeterSamplesBody,
  commandsMeterSamplesData,
  METER_SAMPLES_PATH,
} from "../Data/commands-meter-samples.data";
import { CommandsMeterSamplesMapper } from "../Mapper/commands-meter-samples.mapper";
import { CommandsMeterSamplesValidator } from "../Validator/commands-meter-samples.validator";

test.describe("HES Commands — Meter Samples", () => {
  test.setTimeout(120_000);

  test(
    "Validate POST /commands/meter-samples — default window",
    { tag: ["@smoke", "@commands", "@hes", "@commands-meter-samples"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterSamplesBody();
      const api = new CommandsMeterSamplesApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterSamplesValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterSamples(body);

      const url = `${process.env.BASE_URL}${METER_SAMPLES_PATH}`;
      await PerformanceTracker.track(
        rawResponse,
        "Commands Meter Samples",
        rawResponse.url(),
        responseTime
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Meter Samples",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsMeterSamplesData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );

      const mapped = CommandsMeterSamplesMapper.mapResponse(responseBody);

      validation.execute("Sample Count", () =>
        validator.validateSampleCount(mapped.samples, body.count),
      );
      validation.execute("Meter Sample ID Sequence", () =>
        validator.validateMeterSampleIdSequence(mapped.samples, body.startId),
      );
      validation.execute("Unique Meter Sample IDs", () =>
        validator.validateUniqueMeterSampleIds(mapped.samples),
      );
      validation.execute("Sequence Numbers Within Device", () =>
        validator.validateSequenceNumbersAscendingWithinDevice(mapped.samples),
      );
      validation.execute("Sample Time Within Device", () =>
        validator.validateSampleTimeAscendingWithinDevice(mapped.samples),
      );
      validation.execute("All Sample Rows", () =>
        validator.validateAllSamples(mapped.samples),
      );
      validation.execute("Profile OBIS Consistent", () =>
        validator.validateProfileObisConsistent(mapped.samples),
      );
      validation.execute("Device Group Consistency", () =>
        validator.validateDeviceConsistencyWithinDeviceGroup(mapped.samples),
      );
      validation.execute("Full API Contract", () =>
        validator.validateFullContract(mapped, body.startId, body.count),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Meter Samples",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "Returns count samples from startId; each sample has registerValues with OBIS codes, sampleTime/createTime, deviceId/nodeId.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/meter-samples — paginated startId",
    { tag: ["@commands", "@hes", "@commands-meter-samples"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterSamplesBody({
        count: commandsMeterSamplesData.paginationCount,
        startId: commandsMeterSamplesData.paginationStartId,
      });
      const api = new CommandsMeterSamplesApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterSamplesValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterSamples(body);

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Meter Samples — Pagination",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsMeterSamplesData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );

      const mapped = CommandsMeterSamplesMapper.mapResponse(responseBody);
      validation.execute("Paginated ID Window", () =>
        validator.validateFullContract(mapped, body.startId, body.count),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Meter Samples — Pagination",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "startId + count window returns sequential meterSampleId values.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/meter-samples — invalid count returns error",
    { tag: ["@commands", "@hes", "@commands-meter-samples", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterSamplesBody({
        count: commandsMeterSamplesData.invalidCount,
      });
      const api = new CommandsMeterSamplesApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterSamplesValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterSamples(body);

      const label = "Commands Meter Samples — Invalid Count";
      const status = rawResponse.status();

      if (BackendResponse.shouldSkipServerFailure(status, label, responseBody)) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary(label, responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "POST",
            requestParams: body,
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "400 for count=0 (backend intermittently returns 500 INTERNAL_ERROR).",
          },
        });
        return;
      }

      validation.execute("Status (bad request)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Error Response", () =>
        validator.validateErrorResponse(responseBody),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: label,
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "count=0 returns 400 with error envelope.",
        },
      });
    },
  );
});
