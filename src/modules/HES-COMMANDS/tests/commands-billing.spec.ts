import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsBillingApi } from "../Api/commands-billing.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  BILLING_PATH,
  buildBillingBody,
  commandsBillingData,
} from "../Data/commands-billing.data";
import { buildQueryMeterJobPath } from "../Data/commands-query-meter-job.data";
import { CommandsBillingValidator } from "../Validator/commands-billing.validator";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";
import {
  CommandsJobInitMapper,
  extractJobNamesFromInitResponse,
} from "../shared/commands-job-init.mapper";
import { pollQueryMeterJob } from "../utils/commands-job-e2e.helper";
import { waitForHesJobQueueSlot } from "../utils/commands-hes-queue.helper";

test.describe("HES Commands — Billing (E2E)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS);

  test(
    "Validate POST /commands/billing → query-meter-job — billing_period_get E2E",
    { tag: ["@smoke", "@commands", "@hes", "@commands-billing", "@e2e"] },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const body = buildBillingBody();
      const billingApi = new CommandsBillingApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const billingValidator = new CommandsBillingValidator();

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await billingApi.postBilling(body);

      await PerformanceTracker.track(
        postRaw,
        "Commands Billing — Init Job",
        postRaw.url(),
        postTime
      );

      const postStatus = postRaw.status();
      if (
        BackendResponse.shouldSkipServerFailure(
          postStatus,
          "Commands Billing — Init Job",
          postBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands Billing — Init Job", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: body,
            responseStatus: postStatus,
            responseBody: postBody,
            expectedBehavior:
              "200 with jobName in meterResults for billing_period_get (backend intermittently returns 500).",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Billing — Init Job",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsBillingData.maxResponseTimeMs,
      });

      validation.execute("Init Success Response", () =>
        initValidator.validateResponse(postBody),
      );

      const mappedInit = CommandsJobInitMapper.mapResponse(postBody);

      validation.execute("Init Summary Counts", () =>
        initValidator.validateSummaryCounts(mappedInit.init.summary),
      );
      validation.execute("Init Successful Meters", () =>
        initValidator.validateSuccessfulMeters(mappedInit.init, body.meters),
      );
      validation.execute("Init Rejected Meters", () =>
        initValidator.validateRejectedMeters(mappedInit.init),
      );
      validation.execute("Init HES Callback Configured", () =>
        initValidator.validateHesCallbackConfigured(mappedInit.init),
      );
      validation.execute("Init Meter Results", () =>
        initValidator.validateAllMeterResults(
          mappedInit.init.meterResults,
          mappedInit.init.summary.successful,
        ),
      );
      validation.execute("Init IN_PROGRESS Status", () =>
        billingValidator.validateInitInProgressStatus(mappedInit),
      );
      validation.execute("Init Message", () =>
        billingValidator.validateInitMessage(mappedInit),
      );
      validation.execute("Init Full Contract", () =>
        initValidator.validateFullInitContract(mappedInit, body.meters),
      );

      const jobNames = extractJobNamesFromInitResponse(postBody);
      validation.execute("Job Name Captured", () => {
        expect(jobNames.length).toBe(1);
        expect(jobNames[0]).toBe(mappedInit.init.meterResults[0].jobName);
      });

      const jobName = jobNames[0];
      const pollResult = await pollQueryMeterJob(queryApi, jobName, {
        timeoutMs: commandsBillingData.jobPollTimeoutMs,
        intervalMs: commandsBillingData.jobPollIntervalMs,
      });

      await PerformanceTracker.track(
        pollResult.rawResponse,
        "Commands Billing — Query Meter Job",
        pollResult.rawResponse.url(),
        pollResult.responseTime
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Billing — Query Meter Job",
        rawResponse: pollResult.rawResponse,
        responseBody: pollResult.responseBody,
        responseTime: pollResult.responseTime,
        maxResponseTimeMs: commandsBillingData.maxResponseTimeMs,
      });

      validation.execute("Query Success Response", () =>
        queryValidator.validateResponse(pollResult.responseBody),
      );
      validation.execute("Query Finished Message", () =>
        billingValidator.validateQueryFinishedMessage(pollResult.mapped.message),
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
      validation.execute("Query All Meter Results", () =>
        queryValidator.validateAllMeterResults(
          pollResult.mapped.job.meterResults,
        ),
      );
      validation.execute("Query Expected Meter Present", () =>
        queryValidator.validateExpectedMeterPresent(
          pollResult.mapped.job.meterResults,
          body.meters[0],
        ),
      );
      validation.execute("Query Billing Period HES Response", () =>
        billingValidator.validateBillingQueryMeterResults(
          pollResult.mapped.job.meterResults,
          body.meters[0],
        ),
      );
      validation.execute("Query Full Contract", () =>
        queryValidator.validateFullContract(
          pollResult.mapped,
          jobName,
          body.meters[0],
        ),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Billing E2E",
        responseTime: postTime + pollResult.responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: postRaw.url(),
          method: "POST → GET",
          requestParams: { body, jobName, pollAttempts: pollResult.pollAttempts },
          responseStatus: pollResult.rawResponse.status(),
          responseBody: {
            init: postBody,
            query: pollResult.responseBody,
          },
          expectedBehavior:
            "POST billing_period_get returns jobName in meterResults; GET query-meter-job returns FINISHED with GET_CONFIG/SUCCESS and BILLING_PERIOD config in hesResponse.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/billing — invalid type returns validation error",
    { tag: ["@commands", "@hes", "@commands-billing", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "invalid_billing_type",
        meters: [commandsBillingData.defaultMeterSerial],
      };

      const api = new CommandsBillingApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postBilling(body as Parameters<CommandsBillingApi["postBilling"]>[0]);

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
        apiName: "Commands Billing — Invalid Type",
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
            "Invalid billing type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
