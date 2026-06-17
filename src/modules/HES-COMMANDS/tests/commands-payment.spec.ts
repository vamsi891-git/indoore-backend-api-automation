import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_PAYMENT_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsPaymentApi } from "../Api/commands-payment.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildLastTokenRechargeAmountGetBody,
  buildPaymentBody,
  commandsPaymentData,
  normalizeMeters,
  PAYMENT_PATH,
  PaymentRequestBody,
} from "../Data/commands-payment.data";
import { buildQueryMeterJobPath } from "../Data/commands-query-meter-job.data";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsPaymentValidator } from "../Validator/commands-payment.validator";
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";
import {
  CommandsJobInitMapper,
  extractJobNamesFromInitResponse,
} from "../shared/commands-job-init.mapper";
import {
  logCommandE2eResponses,
  pollQueryMeterJob,
} from "../utils/commands-job-e2e.helper";

interface PaymentE2eCase {
  title: string;
  tags: string[];
  body: PaymentRequestBody;
  logLabel: string;
  apiName: string;
  expectedBehavior: string;
  queryPaymentValidation:
    | "payment"
    | "last_token_recharge_amount";
}

const paymentE2eCases: PaymentE2eCase[] = [
  {
    title:
      "Validate POST /commands/payment → query-meter-job — payment_get E2E",
    tags: ["@smoke", "@commands", "@hes", "@commands-payment", "@e2e"],
    body: buildPaymentBody(),
    logLabel: "Commands Payment — payment_get",
    apiName: "Commands Payment E2E — payment_get",
    expectedBehavior:
      "POST payment_get returns jobName; GET query-meter-job returns FINISHED with PAYMENT config (token, balance, mode) and every hesResponse field populated.",
    queryPaymentValidation: "payment",
  },
  {
    title:
      "Validate POST /commands/payment → query-meter-job — last_token_recharge_amount_get E2E",
    tags: [
      "@smoke",
      "@commands",
      "@hes",
      "@commands-payment",
      "@commands-payment-last-token",
      "@e2e",
    ],
    body: buildLastTokenRechargeAmountGetBody(),
    logLabel: "Commands Payment — last_token_recharge_amount_get",
    apiName: "Commands Payment E2E — last_token_recharge_amount_get",
    expectedBehavior:
      "POST last_token_recharge_amount_get returns jobName; GET query-meter-job returns FINISHED with PAYMENT token.amountAtLastRecharge and all payment fields populated.",
    queryPaymentValidation: "last_token_recharge_amount",
  },
];

test.describe("HES Commands — Payment (E2E)", () => {
  test.setTimeout(HES_COMMANDS_PAYMENT_TEST_TIMEOUT_MS);

  for (const paymentCase of paymentE2eCases) {
    test(paymentCase.title, { tag: paymentCase.tags }, async ({ authenticatedApi }, testInfo) => {
      const body = paymentCase.body;
      const requestedMeters = normalizeMeters(body.meters);
      const paymentApi = new CommandsPaymentApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const paymentValidator = new CommandsPaymentValidator();

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await paymentApi.postPayment(body);

      const postUrl = `${process.env.BASE_URL}${PAYMENT_PATH}`;
      await PerformanceTracker.track(
        postRaw,
        "Commands Payment — Init Job",
        postUrl,
        postTime,
      );

      const postStatus = postRaw.status();
      if (
        BackendResponse.shouldSkipServerFailure(
          postStatus,
          "Commands Payment — Init Job",
          postBody,
        )
      ) {
        logCommandE2eResponses(paymentCase.logLabel, postBody);
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands Payment — Init Job", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: "/indore/commands/payment",
            method: "POST",
            requestParams: body,
            responseStatus: postStatus,
            responseBody: postBody,
            expectedBehavior: `200 with jobName in meterResults for ${body.type} (backend intermittently returns 500).`,
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Payment — Init Job",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsPaymentData.maxResponseTimeMs,
      });

      validation.execute("Init Response Envelope", () =>
        paymentValidator.validateInitResponseEnvelope(postBody),
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
        paymentValidator.validateInitNote(mappedInit),
      );
      validation.execute("Init Meter Results", () =>
        initValidator.validateAllMeterResults(
          mappedInit.init.meterResults,
          mappedInit.init.summary.successful,
        ),
      );
      validation.execute("Init IN_PROGRESS Status", () =>
        paymentValidator.validateInitInProgressStatus(mappedInit),
      );
      validation.execute("Init Message", () =>
        paymentValidator.validateInitMessage(mappedInit),
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
          timeoutMs: commandsPaymentData.jobPollTimeoutMs,
          intervalMs: commandsPaymentData.jobPollIntervalMs,
        });
      } catch (error) {
        logCommandE2eResponses(paymentCase.logLabel, postBody, undefined, {
          jobName,
        });
        throw error;
      }

      logCommandE2eResponses(
        paymentCase.logLabel,
        postBody,
        pollResult.responseBody,
        { pollAttempts: pollResult.pollAttempts, jobName },
      );

      const queryUrl = `${process.env.BASE_URL}${buildQueryMeterJobPath(jobName)}`;
      await PerformanceTracker.track(
        pollResult.rawResponse,
        "Commands Payment — Query Meter Job",
        queryUrl,
        pollResult.responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Payment — Query Meter Job",
        rawResponse: pollResult.rawResponse,
        responseBody: pollResult.responseBody,
        responseTime: pollResult.responseTime,
        maxResponseTimeMs: commandsPaymentData.maxResponseTimeMs,
      });

      validation.execute("Query Success Response", () =>
        queryValidator.validateResponse(pollResult.responseBody),
      );
      validation.execute("Query Response Envelope", () =>
        paymentValidator.validateQueryResponseEnvelope(pollResult.mapped),
      );
      validation.execute("Query Finished Message", () =>
        paymentValidator.validateQueryFinishedMessage(pollResult.mapped.message),
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
      validation.execute("Query Payment HES Response — All Fields", () => {
        if (paymentCase.queryPaymentValidation === "last_token_recharge_amount") {
          paymentValidator.validateLastTokenRechargeAmountQueryMeterResults(
            pollResult.mapped.job.meterResults,
            requestedMeters[0],
          );
          return;
        }
        paymentValidator.validatePaymentQueryMeterResults(
          pollResult.mapped.job.meterResults,
          requestedMeters[0],
        );
      });
      validation.execute("Query Full Contract", () =>
        queryValidator.validateFullContract(
          pollResult.mapped,
          jobName,
          requestedMeters[0],
        ),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: paymentCase.apiName,
        responseTime: postTime + pollResult.responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint:
            "/indore/commands/payment → /indore/commands/query-meter-job/:jobName",
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
          expectedBehavior: paymentCase.expectedBehavior,
        },
      });
    });
  }

  test(
    "Validate POST /commands/payment — invalid type returns validation error",
    { tag: ["@commands", "@hes", "@commands-payment", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "invalid_payment_type",
        meters: commandsPaymentData.defaultMeterSerial,
      };

      const api = new CommandsPaymentApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postPayment(
          body as Parameters<CommandsPaymentApi["postPayment"]>[0],
        );

      logCommandE2eResponses("Commands Payment — Invalid Type", responseBody);

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
        apiName: "Commands Payment — Invalid Type",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/payment",
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "Invalid payment type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
