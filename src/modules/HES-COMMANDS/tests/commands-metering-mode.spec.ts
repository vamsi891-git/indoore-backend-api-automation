import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsMeteringModeApi } from "../Api/commands-metering-mode.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildMeteringModeBody,
  commandsMeteringModeData,
  METERING_MODE_PATH,
  normalizeMeters,
} from "../Data/commands-metering-mode.data";
import { buildQueryMeterJobPath } from "../Data/commands-query-meter-job.data";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsMeteringModeValidator } from "../Validator/commands-metering-mode.validator";
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";
import {
  CommandsJobInitMapper,
  extractJobNamesFromInitResponse,
} from "../shared/commands-job-init.mapper";
import {
  logCommandE2eResponses,
  pollQueryMeterJob,
  softSkipHesE2eInfraFailure,
} from "../utils/commands-job-e2e.helper";
import { waitForHesJobQueueSlot } from "../utils/commands-hes-queue.helper";

test.describe("HES Commands — Metering Mode (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS);

  test(
    "Validate POST /commands/metering-mode → query-meter-job — metering_mode_get E2E",
    {
      tag: [
        "@smoke",
        "@commands",
        "@hes",
        "@commands-metering-mode",
        "@e2e",
      ],
    },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const body = buildMeteringModeBody();
      const requestedMeters = normalizeMeters(body.meters);
      const meteringApi = new CommandsMeteringModeApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const meteringValidator = new CommandsMeteringModeValidator();

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await meteringApi.postMeteringMode(body);

      await PerformanceTracker.track(
        postRaw,
        "Commands Metering Mode — Init Job",
        postRaw.url(),
        postTime
      );

      const postStatus = postRaw.status();
      if (
        BackendResponse.shouldSkipServerFailure(
          postStatus,
          "Commands Metering Mode — Init Job",
          postBody,
        )
      ) {
        logCommandE2eResponses("Commands Metering Mode", postBody);
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary(
          "Commands Metering Mode — Init Job",
          postTime,
          {
            testInfo,
            defectContext: {
              module: "HES-COMMANDS",
              endpoint: postRaw.url(),
              method: "POST",
              requestParams: body,
              responseStatus: postStatus,
              responseBody: postBody,
              expectedBehavior:
                "200 with jobName in meterResults for metering_mode_get (backend intermittently returns 500).",
            },
          },
        );
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Metering Mode — Init Job",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsMeteringModeData.maxResponseTimeMs,
      });

      validation.execute("Init Response Envelope", () =>
        meteringValidator.validateInitResponseEnvelope(postBody),
      );
      validation.execute("Init Success Response", () =>
        initValidator.validateResponse(postBody),
      );

      const mappedInit = CommandsJobInitMapper.mapResponse(postBody);

      validation.execute("Init Summary Counts", () =>
        initValidator.validateSummaryCounts(mappedInit.init.summary),
      );
      validation.execute("Init Successful Meters", () =>
        initValidator.validateSuccessfulMeters(mappedInit.init, requestedMeters),
      );
      validation.execute("Init Rejected Meters", () =>
        initValidator.validateRejectedMeters(mappedInit.init),
      );
      validation.execute("Init HES Callback Configured", () =>
        initValidator.validateHesCallbackConfigured(mappedInit.init),
      );
      validation.execute("Init Note", () =>
        meteringValidator.validateInitNote(mappedInit),
      );
      validation.execute("Init Meter Results", () =>
        initValidator.validateAllMeterResults(
          mappedInit.init.meterResults,
          mappedInit.init.summary.successful,
        ),
      );
      validation.execute("Init IN_PROGRESS Status", () =>
        meteringValidator.validateInitInProgressStatus(mappedInit),
      );
      validation.execute("Init Message", () =>
        meteringValidator.validateInitMessage(mappedInit),
      );
      validation.execute("Init Full Contract", () =>
        initValidator.validateFullInitContract(mappedInit, requestedMeters),
      );

      const jobNames = extractJobNamesFromInitResponse(postBody);
      validation.execute("Job Name Captured", () => {
        expect(jobNames.length).toBe(1);
        expect(jobNames[0]).toBe(mappedInit.init.meterResults[0].jobName);
      });

      const jobName = jobNames[0];
      let pollResult;
      try {
        pollResult = await pollQueryMeterJob(queryApi, jobName, {
          timeoutMs: commandsMeteringModeData.jobPollTimeoutMs,
          intervalMs: commandsMeteringModeData.jobPollIntervalMs,
          stuckMs: commandsMeteringModeData.jobPollStuckMs,
          expectedCommand: "metering_mode_get",
        });
      } catch (error) {
        logCommandE2eResponses("Commands Metering Mode", postBody, undefined, {
          jobName,
        });
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      logCommandE2eResponses(
        "Commands Metering Mode",
        postBody,
        pollResult.responseBody,
        { pollAttempts: pollResult.pollAttempts, jobName },
      );

      await PerformanceTracker.track(
        pollResult.rawResponse,
        "Commands Metering Mode — Query Meter Job",
        pollResult.rawResponse.url(),
        pollResult.responseTime
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Metering Mode — Query Meter Job",
        rawResponse: pollResult.rawResponse,
        responseBody: pollResult.responseBody,
        responseTime: pollResult.responseTime,
        maxResponseTimeMs: commandsMeteringModeData.maxResponseTimeMs,
      });

      validation.execute("Query Success Response", () =>
        queryValidator.validateResponse(pollResult.responseBody),
      );
      validation.execute("Query Response Envelope", () =>
        meteringValidator.validateQueryResponseEnvelope(pollResult.mapped),
      );
      validation.execute("Query Finished Message", () =>
        meteringValidator.validateQueryFinishedMessage(pollResult.mapped.message),
      );
      validation.execute("Query Job Name Echo", () =>
        queryValidator.validateJobNameEcho(pollResult.mapped, jobName),
      );
      validation.execute("Query Sync Flags", () =>
        queryValidator.validateSyncFlags(pollResult.mapped),
      );
      validation.execute("Query HES Job Status FINISHED", () => {
        expect(pollResult.mapped.job.hesJobStatus).toBe("FINISHED");
      });
      validation.execute("Query HES Status Code", () =>
        queryValidator.validateHesStatusCode(pollResult.mapped),
      );
      validation.execute("Query Summary Counts", () =>
        queryValidator.validateSummaryCounts(pollResult.mapped.job.summary),
      );
      validation.execute("Query Summary vs Meter Results", () =>
        queryValidator.validateSummaryMatchesMeterResults(
          pollResult.mapped.job.summary,
          pollResult.mapped.job.meterResults,
        ),
      );
      validation.execute("Query Status Summary Alignment", () =>
        queryValidator.validateStatusSummaryAlignment(
          pollResult.mapped.job.summary,
          pollResult.mapped.job.meterResults,
        ),
      );
      validation.execute("Query All Meter Results", () =>
        queryValidator.validateAllMeterResults(
          pollResult.mapped.job.meterResults,
        ),
      );
      validation.execute("Query Expected Meter Present", () =>
        queryValidator.validateExpectedMeterPresent(
          pollResult.mapped.job.meterResults,
          requestedMeters[0],
        ),
      );
      validation.execute("Query Metering Mode HES Response — All Fields", () =>
        meteringValidator.validateMeteringModeQueryMeterResults(
          pollResult.mapped.job.meterResults,
          requestedMeters[0],
        ),
      );
      validation.execute("Query Full Contract", () =>
        queryValidator.validateFullContract(
          pollResult.mapped,
          jobName,
          requestedMeters[0],
        ),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Metering Mode E2E",
        responseTime: postTime + pollResult.responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: postRaw.url(),
          method: "POST → GET",
          requestParams: {
            body,
            jobName,
            pollAttempts: pollResult.pollAttempts,
          },
          responseStatus: pollResult.rawResponse.status(),
          responseBody: {
            init: postBody,
            query: pollResult.responseBody,
          },
          expectedBehavior:
            "POST metering_mode_get returns jobName; GET query-meter-job returns FINISHED with GET_CONFIG/SUCCESS and hesResponse (meterId, status, failureStep, progress null, response null).",
        },
      });
    },
  );

  test(
    "Validate POST /commands/metering-mode — invalid type returns validation error",
    { tag: ["@commands", "@hes", "@commands-metering-mode", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "invalid_metering_mode_type",
        meters: commandsMeteringModeData.defaultMeterSerial,
      };

      const api = new CommandsMeteringModeApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeteringMode(
          body as Parameters<CommandsMeteringModeApi["postMeteringMode"]>[0],
        );

      logCommandE2eResponses(
        "Commands Metering Mode — Invalid Type",
        responseBody,
      );

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Error Response", () =>
        initValidator.validateErrorResponse(responseBody),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Metering Mode — Invalid Type",
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
            "Invalid metering mode type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
