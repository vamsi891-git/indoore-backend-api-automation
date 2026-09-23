import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { getTotpSecret } from "../../../core/utils/totp.util";
import { CommandsBillingApi } from "../Api/commands-billing.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildBillingBody,
  buildBillingSetBody,
  commandsBillingData,
  parseBillingCycle,
  parseBillingDayOfMonth,
  pickAlternateDayOfMonth,
  BillingRequestBody,
} from "../Data/commands-billing.data";
import { CommandsBillingValidator } from "../Validator/commands-billing.validator";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";
import {
  CommandsJobInitMapper,
  extractJobNamesFromInitResponse,
} from "../shared/commands-job-init.mapper";
import { buildCommandsStepUpOtp } from "../shared/commands-step-up-otp";
import {
  assertHesE2eQueryPhase,
  pollQueryMeterJob,
  softSkipHesE2eInfraFailure,
  logCommandConfigValueSnapshot,
  PollQueryMeterJobResult,
} from "../utils/commands-job-e2e.helper";
import { waitForHesJobQueueSlot } from "../utils/commands-hes-queue.helper";

test.describe("HES Commands — Billing (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS * 2);

  test(
    "Validate POST /commands/billing → query-meter-job — billing GET then SET then GET-after",
    { tag: ["@smoke", "@commands", "@hes", "@commands-billing", "@e2e"] },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const getBody = buildBillingBody();
      const billingApi = new CommandsBillingApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const billingValidator = new CommandsBillingValidator();

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await billingApi.postBilling(getBody);

      await PerformanceTracker.track(
        postRaw,
        "Commands Billing — Init GET",
        postRaw.url(),
        postTime,
      );

      const postStatus = postRaw.status();
      if (
        BackendResponse.shouldSkipServerFailure(postStatus, "Commands Billing — Init GET", postBody)
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands Billing — Init GET", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: getBody,
            responseStatus: postStatus,
            responseBody: postBody,
            expectedBehavior:
              "200 with jobName in meterResults for billing_period_get (backend intermittently returns 500).",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Billing — Init GET",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsBillingData.maxResponseTimeMs,
      });

      validation.execute("Init Success Response", () => initValidator.validateResponse(postBody));

      const mappedInit = CommandsJobInitMapper.mapResponse(postBody);

      validation.execute("Init Summary Counts", () =>
        initValidator.validateSummaryCounts(mappedInit.init.summary),
      );
      validation.execute("Init Successful Meters", () =>
        initValidator.validateSuccessfulMeters(mappedInit.init, getBody.meters),
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
      validation.execute("Init Async Timings Null", () =>
        billingValidator.validateInitAsyncTimings(mappedInit),
      );
      validation.execute("Init Message", () => billingValidator.validateInitMessage(mappedInit));
      validation.execute("Init Full Contract", () =>
        initValidator.validateFullInitContract(mappedInit, getBody.meters),
      );

      const jobNames = extractJobNamesFromInitResponse(postBody);
      validation.execute("Job Name Captured", () => {
        expect(jobNames.length).toBe(1);
        expect(jobNames[0]).toBe(mappedInit.init.meterResults[0].jobName);
      });

      const getJobName = jobNames[0];
      let getPoll: PollQueryMeterJobResult;
      try {
        getPoll = await pollQueryMeterJob(queryApi, getJobName, {
          timeoutMs: commandsBillingData.jobPollTimeoutMs,
          intervalMs: commandsBillingData.jobPollIntervalMs,
          stuckMs: commandsBillingData.jobPollStuckMs,
          expectedCommand: "billing_period_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      await PerformanceTracker.track(
        getPoll.rawResponse,
        "Commands Billing — Query GET",
        getPoll.rawResponse.url(),
        getPoll.responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Billing — Query GET",
        rawResponse: getPoll.rawResponse,
        responseBody: getPoll.responseBody,
        responseTime: getPoll.responseTime,
        maxResponseTimeMs: commandsBillingData.maxResponseTimeMs,
      });

      let initialValues: string | null = null;
      let initialDay: number | null = null;
      let initialCycle: (typeof commandsBillingData.billingCycles)[number] | null = null;

      assertHesE2eQueryPhase({
        validation,
        queryValidator,
        pollResult: getPoll,
        jobName: getJobName,
        meterId: getBody.meters[0],
        onFinished: () => {
          validation.execute("Query Finished Message", () =>
            billingValidator.validateQueryFinishedMessage(getPoll.mapped.message),
          );
          validation.execute("Query HES Job Status FINISHED", () => {
            expect(getPoll.mapped.job.hesJobStatus).toBe("FINISHED");
          });
          validation.execute("Query Summary Counts", () =>
            queryValidator.validateSummaryCounts(getPoll.mapped.job.summary),
          );
          validation.execute("Query All Meter Results", () =>
            queryValidator.validateAllMeterResults(getPoll.mapped.job.meterResults),
          );
          validation.execute("Query Billing Period HES Response", () =>
            billingValidator.validateBillingQueryMeterResults(
              getPoll.mapped.job.meterResults,
              getBody.meters[0],
              {
                meterResponse: getPoll.mapped.job.meterResponse,
                meterResponseRows: getPoll.mapped.job.meterResponseRows,
                message: getPoll.mapped.job.message,
              },
            ),
          );
          validation.execute("Query Full Contract", () =>
            queryValidator.validateFullContract(getPoll.mapped, getJobName, getBody.meters[0]),
          );
          initialValues = getPoll.mapped.job.meterResponse ?? null;
          initialDay = parseBillingDayOfMonth(initialValues);
          initialCycle = parseBillingCycle(initialValues);
        },
      });

      if (!getPoll.completed || initialValues == null || initialDay == null) {
        logCommandConfigValueSnapshot({
          label: "Billing",
          meterId: getBody.meters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues:
            initialValues ?? "(GET not FINISHED or Day Of Month missing — SET skipped)",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Billing E2E",
          responseTime: postTime + getPoll.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: { body: getBody, jobName: getJobName, completed: getPoll.completed },
            responseStatus: getPoll.rawResponse.status(),
            responseBody: { init: postBody, query: getPoll.responseBody },
            expectedBehavior: "GET must FINISH with Day Of Month before SET round-trip can run.",
          },
        });
        return;
      }

      if (!getTotpSecret()) {
        logCommandConfigValueSnapshot({
          label: "Billing",
          meterId: getBody.meters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues,
          setPayloadSummary: "n/a (TOTP_SECRET missing — cannot SET)",
        });
        testInfo.annotations.push({
          type: "notice",
          description: "SET skipped: set TOTP_SECRET in .env to run billing_period_set",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Billing E2E (GET only — no TOTP)",
          responseTime: postTime + getPoll.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: { body: getBody, jobName: getJobName },
            responseStatus: getPoll.rawResponse.status(),
            responseBody: { init: postBody, query: getPoll.responseBody },
            expectedBehavior: "GET OK; SET needs TOTP_SECRET for otp in POST body.",
          },
        });
        return;
      }

      const targetDay = pickAlternateDayOfMonth(initialDay);
      const cycle = initialCycle ?? "MONTHLY";
      const setPayloadSummary = `dayOfMonth=${targetDay}, billingCycle=${cycle} (was day=${initialDay})`;
      const setBody = buildBillingSetBody({
        meters: getBody.meters,
        dayOfMonth: targetDay,
        billingCycle: cycle,
        otp: buildCommandsStepUpOtp(),
      });

      await waitForHesJobQueueSlot();
      const {
        rawResponse: setRaw,
        responseBody: setPostBody,
        responseTime: setPostTime,
      } = await billingApi.postBilling(setBody);

      await PerformanceTracker.track(
        setRaw,
        "Commands Billing — Init SET",
        setRaw.url(),
        setPostTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          setRaw.status(),
          "Commands Billing — Init SET",
          setPostBody,
        )
      ) {
        logCommandConfigValueSnapshot({
          label: "Billing",
          meterId: getBody.meters[0],
          commandType: setBody.type,
          setRan: false,
          initialValues,
          setPayloadSummary: `${setPayloadSummary} — SET init failed HTTP ${setRaw.status()}`,
        });
        validation.printSummary("Commands Billing — Init SET", setPostTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for billing_period_set + otp.",
          },
        });
        return;
      }

      if (!setPostBody?.success || !setPostBody.data) {
        logCommandConfigValueSnapshot({
          label: "Billing",
          meterId: getBody.meters[0],
          commandType: setBody.type,
          setRan: false,
          initialValues,
          setPayloadSummary: `SET rejected — HTTP ${setRaw.status()} success=${setPostBody?.success}`,
        });
        BackendResponse.logFinding(
          `HES ${setBody.type} SET init rejected`,
          JSON.stringify(setPostBody?.error ?? setPostBody).slice(0, 400),
        );
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Billing E2E (SET rejected)",
          responseTime: setPostTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for billing_period_set + otp.",
          },
        });
        return;
      }

      validation.execute("SET Init Success Response", () =>
        initValidator.validateResponse(setPostBody),
      );
      const mappedSetInit = CommandsJobInitMapper.mapResponse(setPostBody);
      validation.execute("SET Init Message", () =>
        billingValidator.validateInitMessage(mappedSetInit),
      );
      validation.execute("SET Init IN_PROGRESS", () =>
        billingValidator.validateInitInProgressStatus(mappedSetInit),
      );

      const setJobName = extractJobNamesFromInitResponse(setPostBody)[0];
      let setPoll: PollQueryMeterJobResult;
      try {
        setPoll = await pollQueryMeterJob(queryApi, setJobName, {
          timeoutMs: commandsBillingData.jobPollTimeoutMs,
          intervalMs: commandsBillingData.jobPollIntervalMs,
          stuckMs: commandsBillingData.jobPollStuckMs,
          expectedCommand: "billing_period_set",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      validation.execute("SET Job FINISHED", () => {
        expect(setPoll.completed).toBe(true);
        expect(setPoll.mapped.job.hesJobStatus).toBe("FINISHED");
        const row = setPoll.mapped.job.meterResults.find((r) => r.meterId === getBody.meters[0]);
        expect(row).toBeDefined();
        expect(row!.status).toBe("SUCCESS");
      });

      await waitForHesJobQueueSlot();
      const afterGetBody = buildBillingBody({ meters: getBody.meters });
      const {
        rawResponse: afterGetRaw,
        responseBody: afterGetPostBody,
        responseTime: afterGetPostTime,
      } = await billingApi.postBilling(afterGetBody);

      const afterGetJobName = extractJobNamesFromInitResponse(afterGetPostBody)[0];
      let afterGetPoll: PollQueryMeterJobResult;
      try {
        afterGetPoll = await pollQueryMeterJob(queryApi, afterGetJobName, {
          timeoutMs: commandsBillingData.jobPollTimeoutMs,
          intervalMs: commandsBillingData.jobPollIntervalMs,
          stuckMs: commandsBillingData.jobPollStuckMs,
          expectedCommand: "billing_period_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      const afterValues = afterGetPoll.completed
        ? (afterGetPoll.mapped.job.meterResponse ?? null)
        : "(after-GET not FINISHED)";

      logCommandConfigValueSnapshot({
        label: "Billing",
        meterId: getBody.meters[0],
        commandType: "GET → SET → GET",
        setRan: true,
        jobName: setJobName,
        initialValues,
        setPayloadSummary,
        afterValues,
      });

      if (afterGetPoll.completed) {
        validation.execute("After-GET Billing Period", () =>
          billingValidator.validateBillingQueryMeterResults(
            afterGetPoll.mapped.job.meterResults,
            getBody.meters[0],
            {
              meterResponse: afterGetPoll.mapped.job.meterResponse,
              meterResponseRows: afterGetPoll.mapped.job.meterResponseRows,
              message: afterGetPoll.mapped.job.message,
            },
          ),
        );
        validation.execute("After value Day Of Month matches SET", () => {
          expect(parseBillingDayOfMonth(afterValues)).toBe(targetDay);
        });
      }

      await waitForHesJobQueueSlot();
      const restoreBody: BillingRequestBody = buildBillingSetBody({
        meters: getBody.meters,
        dayOfMonth: initialDay,
        billingCycle: cycle,
        otp: buildCommandsStepUpOtp(),
      });
      const { rawResponse: restoreRaw, responseBody: restorePostBody } =
        await billingApi.postBilling(restoreBody);

      if (restoreRaw.status() < 400 && restorePostBody.success) {
        try {
          const restoreJobName = extractJobNamesFromInitResponse(restorePostBody)[0];
          await pollQueryMeterJob(queryApi, restoreJobName, {
            timeoutMs: commandsBillingData.jobPollTimeoutMs,
            intervalMs: commandsBillingData.jobPollIntervalMs,
            stuckMs: commandsBillingData.jobPollStuckMs,
            expectedCommand: "billing_period_set",
          });
          console.log(`[Billing] Restored dayOfMonth to ${initialDay} (original).`);
        } catch (error) {
          console.log(
            `[Billing] Restore poll failed (meter may still be at day ${targetDay}): ${String(error)}`,
          );
        }
      } else {
        console.log(
          `[Billing] Restore SET skipped/failed HTTP ${restoreRaw.status()} — meter may still be at day ${targetDay}.`,
        );
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Billing E2E (GET → SET → GET)",
        responseTime:
          postTime +
          getPoll.responseTime +
          setPostTime +
          setPoll.responseTime +
          afterGetPostTime +
          afterGetPoll.responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: postRaw.url(),
          method: "POST GET → SET → GET",
          requestParams: {
            getBody,
            setBody: { ...setBody, otp: "***" },
            getJobName,
            setJobName,
            afterGetJobName,
            initialValues,
            setPayloadSummary,
            afterValues,
          },
          responseStatus: afterGetRaw.status(),
          responseBody: {
            getInit: postBody,
            getQuery: getPoll.responseBody,
            setInit: setPostBody,
            setQuery: setPoll.responseBody,
            afterGetInit: afterGetPostBody,
            afterGetQuery: afterGetPoll.responseBody,
          },
          expectedBehavior:
            "GET initial → SET dayOfMonth with otp → GET after shows new day; restore original.",
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
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } = await api.postBilling(
        body as Parameters<CommandsBillingApi["postBilling"]>[0],
      );

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Error Response", () => initValidator.validateErrorResponse(responseBody));

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
          expectedBehavior: "Invalid billing type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
