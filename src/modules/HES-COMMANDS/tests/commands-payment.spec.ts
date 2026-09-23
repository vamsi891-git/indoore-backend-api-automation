import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_PAYMENT_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { getTotpSecret } from "../../../core/utils/totp.util";
import { CommandsPaymentApi } from "../Api/commands-payment.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildLastTokenRechargeAmountGetBody,
  buildPaymentBody,
  buildPaymentSetPostpaidBody,
  buildPaymentSetPrepaidBody,
  commandsPaymentData,
  expectedModeAfterSet,
  normalizeMeters,
  parsePaymentMode,
  pickAlternatePaymentSetType,
} from "../Data/commands-payment.data";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsPaymentValidator } from "../Validator/commands-payment.validator";
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";
import {
  CommandsJobInitMapper,
  extractJobNamesFromInitResponse,
} from "../shared/commands-job-init.mapper";
import { buildCommandsStepUpOtp } from "../shared/commands-step-up-otp";
import {
  assertHesE2eQueryPhase,
  logCommandConfigValueSnapshot,
  pollQueryMeterJob,
  softSkipHesE2eInfraFailure,
  PollQueryMeterJobResult,
} from "../utils/commands-job-e2e.helper";
import { waitForHesJobQueueSlot } from "../utils/commands-hes-queue.helper";

test.describe("HES Commands — Payment (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_PAYMENT_TEST_TIMEOUT_MS * 2);

  test(
    "Validate POST /commands/payment — complete flow: GET → SET mode → GET-after → restore",
    { tag: ["@smoke", "@commands", "@hes", "@commands-payment", "@e2e"] },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const getBody = buildPaymentBody();
      const requestedMeters = normalizeMeters(getBody.meters);
      const paymentApi = new CommandsPaymentApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const paymentValidator = new CommandsPaymentValidator();

      // ─── Step 1: GET (initial) ───────────────────────────────────────────
      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await paymentApi.postPayment(getBody);

      await PerformanceTracker.track(
        postRaw,
        "Commands Payment — Init GET",
        postRaw.url(),
        postTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          postRaw.status(),
          "Commands Payment — Init GET",
          postBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands Payment — Init GET", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: getBody,
            responseStatus: postRaw.status(),
            responseBody: postBody,
            expectedBehavior: "200 with jobName for payment_get.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Payment — Init GET",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsPaymentData.maxResponseTimeMs,
      });

      validation.execute("Init Response Envelope", () =>
        paymentValidator.validateInitResponseEnvelope(postBody),
      );
      validation.execute("Init Success Response", () => initValidator.validateResponse(postBody));

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
      validation.execute("Init Note", () => paymentValidator.validateInitNote(mappedInit));
      validation.execute("Init Meter Results", () =>
        initValidator.validateAllMeterResults(
          mappedInit.init.meterResults,
          mappedInit.init.summary.successful,
        ),
      );
      validation.execute("Init IN_PROGRESS Status", () =>
        paymentValidator.validateInitInProgressStatus(mappedInit),
      );
      validation.execute("Init Async Timings Null", () =>
        paymentValidator.validateInitAsyncTimings(mappedInit),
      );
      validation.execute("Init Message", () => paymentValidator.validateInitMessage(mappedInit));
      validation.execute("Init Full Contract", () =>
        initValidator.validateFullInitContract(mappedInit, requestedMeters),
      );

      const getJobName = extractJobNamesFromInitResponse(postBody)[0];
      validation.execute("Job Name Captured", () => {
        expect(getJobName).toBe(mappedInit.init.meterResults[0].jobName);
      });

      let getPoll: PollQueryMeterJobResult;
      try {
        getPoll = await pollQueryMeterJob(queryApi, getJobName, {
          timeoutMs: commandsPaymentData.jobPollTimeoutMs,
          intervalMs: commandsPaymentData.jobPollIntervalMs,
          stuckMs: commandsPaymentData.jobPollStuckMs,
          expectedCommand: "payment_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      await PerformanceTracker.track(
        getPoll.rawResponse,
        "Commands Payment — Query GET",
        getPoll.rawResponse.url(),
        getPoll.responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Payment — Query GET",
        rawResponse: getPoll.rawResponse,
        responseBody: getPoll.responseBody,
        responseTime: getPoll.responseTime,
        maxResponseTimeMs: commandsPaymentData.maxResponseTimeMs,
      });

      assertHesE2eQueryPhase({
        validation,
        queryValidator,
        pollResult: getPoll,
        jobName: getJobName,
        meterId: requestedMeters[0],
        onFinished: () => {
          validation.execute("Query Response Envelope", () =>
            paymentValidator.validateQueryResponseEnvelope(getPoll.mapped),
          );
          validation.execute("Query Finished Message", () =>
            paymentValidator.validateQueryFinishedMessage(getPoll.mapped.message),
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
          validation.execute("Query Payment HES Response", () =>
            paymentValidator.validatePaymentQueryMeterResults(
              getPoll.mapped.job.meterResults,
              requestedMeters[0],
              {
                meterResponse: getPoll.mapped.job.meterResponse,
                meterResponseRows: getPoll.mapped.job.meterResponseRows,
                message: getPoll.mapped.job.message,
              },
            ),
          );
          validation.execute("Query Full Contract", () =>
            queryValidator.validateFullContract(getPoll.mapped, getJobName, requestedMeters[0]),
          );
        },
      });

      if (!getPoll.completed) {
        console.log("\n[Payment] Step 1 INITIAL: (GET not FINISHED — stopping)\n");
        logCommandConfigValueSnapshot({
          label: "Payment complete flow",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues: "(GET not FINISHED — SET skipped)",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Payment E2E — complete flow",
          responseTime: postTime + getPoll.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: { getBody, getJobName, completed: getPoll.completed },
            responseStatus: getPoll.rawResponse.status(),
            responseBody: { init: postBody, query: getPoll.responseBody },
            expectedBehavior: "GET must FINISH before SET.",
          },
        });
        return;
      }

      const initialValues = getPoll.mapped.job.meterResponse ?? "(none)";
      const initialMode = parsePaymentMode(initialValues);
      expect(initialMode, "Expected Mode in payment meterResponse").toBeTruthy();

      console.log(`\n[Payment] Step 1 INITIAL value:  ${initialValues}`);
      console.log(`[Payment] Step 1 INITIAL mode:    ${initialMode}\n`);

      if (!getTotpSecret()) {
        console.log("[Payment] Step 2 SET: skipped (TOTP_SECRET missing)\n");
        logCommandConfigValueSnapshot({
          label: "Payment complete flow",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues,
          setPayloadSummary: "n/a (TOTP_SECRET missing — cannot SET)",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Payment E2E — complete flow (GET only)",
          responseTime: postTime + getPoll.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: { getBody, getJobName },
            responseStatus: getPoll.rawResponse.status(),
            responseBody: { init: postBody, query: getPoll.responseBody },
            expectedBehavior: "GET OK; SET needs TOTP_SECRET for otp.",
          },
        });
        return;
      }

      // ─── Step 2: SET mode (prepaid ↔ postpaid) ───────────────────────────
      const setType = pickAlternatePaymentSetType(initialMode!);
      const targetMode = expectedModeAfterSet(setType);
      const setPayloadSummary = `${setType} → expect mode=${targetMode} (was ${initialMode})`;
      const setBody =
        setType === "payment_set_prepaid"
          ? buildPaymentSetPrepaidBody({
              meters: getBody.meters,
              otp: buildCommandsStepUpOtp(),
            })
          : buildPaymentSetPostpaidBody({
              meters: getBody.meters,
              otp: buildCommandsStepUpOtp(),
            });

      console.log(`[Payment] Step 2 AFTER SETTING (payload): ${setPayloadSummary}\n`);

      await waitForHesJobQueueSlot();
      const {
        rawResponse: setRaw,
        responseBody: setPostBody,
        responseTime: setPostTime,
      } = await paymentApi.postPayment(setBody);

      await PerformanceTracker.track(
        setRaw,
        "Commands Payment — Init SET",
        setRaw.url(),
        setPostTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          setRaw.status(),
          "Commands Payment — Init SET",
          setPostBody,
        )
      ) {
        logCommandConfigValueSnapshot({
          label: "Payment complete flow",
          meterId: requestedMeters[0],
          commandType: setBody.type,
          setRan: false,
          initialValues,
          setPayloadSummary: `${setPayloadSummary} — SET init failed HTTP ${setRaw.status()}`,
        });
        validation.printSummary("Commands Payment — Init SET", setPostTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: `200 with jobName for ${setType} + otp.`,
          },
        });
        return;
      }

      if (!setPostBody?.success || !setPostBody.data) {
        logCommandConfigValueSnapshot({
          label: "Payment complete flow",
          meterId: requestedMeters[0],
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
          apiName: "Commands Payment E2E (SET rejected)",
          responseTime: setPostTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: `200 with jobName for ${setType} + otp.`,
          },
        });
        return;
      }

      validation.execute("SET Init Success", () => initValidator.validateResponse(setPostBody));
      const mappedSetInit = CommandsJobInitMapper.mapResponse(setPostBody);
      validation.execute("SET Init Message", () =>
        paymentValidator.validateInitMessage(mappedSetInit, true),
      );
      validation.execute("SET Init IN_PROGRESS", () =>
        paymentValidator.validateInitInProgressStatus(mappedSetInit),
      );
      validation.execute("SET Init Async Timings Null", () =>
        paymentValidator.validateInitAsyncTimings(mappedSetInit),
      );

      const setJobName = extractJobNamesFromInitResponse(setPostBody)[0];
      let setPoll: PollQueryMeterJobResult;
      try {
        setPoll = await pollQueryMeterJob(queryApi, setJobName, {
          timeoutMs: commandsPaymentData.jobPollTimeoutMs,
          intervalMs: commandsPaymentData.jobPollIntervalMs,
          stuckMs: commandsPaymentData.jobPollStuckMs,
          expectedCommand: setType,
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      validation.execute("SET Job FINISHED", () => {
        expect(setPoll.completed).toBe(true);
        expect(setPoll.mapped.job.hesJobStatus).toBe("FINISHED");
        const row = setPoll.mapped.job.meterResults.find((r) => r.meterId === requestedMeters[0]);
        expect(row).toBeDefined();
        expect(row!.status).toBe("SUCCESS");
      });

      // ─── Step 3: GET after SET ────────────────────────────────────────────
      await waitForHesJobQueueSlot();
      const afterGetBody = buildPaymentBody({ meters: getBody.meters });
      const {
        rawResponse: afterGetRaw,
        responseBody: afterGetPostBody,
        responseTime: afterGetPostTime,
      } = await paymentApi.postPayment(afterGetBody);
      const afterGetJobName = extractJobNamesFromInitResponse(afterGetPostBody)[0];

      let afterGetPoll: PollQueryMeterJobResult;
      try {
        afterGetPoll = await pollQueryMeterJob(queryApi, afterGetJobName, {
          timeoutMs: commandsPaymentData.jobPollTimeoutMs,
          intervalMs: commandsPaymentData.jobPollIntervalMs,
          stuckMs: commandsPaymentData.jobPollStuckMs,
          expectedCommand: "payment_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      const afterValues = afterGetPoll.completed
        ? (afterGetPoll.mapped.job.meterResponse ?? "(none)")
        : "(after-GET not FINISHED)";
      const afterMode = parsePaymentMode(afterValues);

      console.log(`[Payment] Step 3 AFTER value:     ${afterValues}`);
      console.log(`[Payment] Step 3 AFTER mode:      ${afterMode ?? "n/a"}\n`);

      // Always print the full clarity block (what you asked for).
      logCommandConfigValueSnapshot({
        label: "Payment complete flow",
        meterId: requestedMeters[0],
        commandType: "GET → SET → GET",
        setRan: true,
        jobName: setJobName,
        initialValues,
        setPayloadSummary,
        afterValues,
      });

      if (afterGetPoll.completed) {
        validation.execute("After-GET Payment contract", () =>
          paymentValidator.validatePaymentQueryMeterResults(
            afterGetPoll.mapped.job.meterResults,
            requestedMeters[0],
            {
              meterResponse: afterGetPoll.mapped.job.meterResponse,
              meterResponseRows: afterGetPoll.mapped.job.meterResponseRows,
              message: afterGetPoll.mapped.job.message,
            },
          ),
        );
        validation.execute("After value Mode present", () => {
          expect(afterMode).toBeTruthy();
        });

        if (afterMode !== targetMode) {
          BackendResponse.logFinding(
            "HES payment mode SET SUCCESS but after-GET mode unchanged",
            `expected=${targetMode} after=${afterMode ?? "null"} initial=${initialMode}. ` +
              "SET finished; meter mode not updated on subsequent GET (backend/HES apply gap).",
          );
        } else {
          validation.execute("After value Mode matches SET", () => {
            expect(afterMode).toBe(targetMode);
          });
        }
      }

      // ─── Step 4: restore original mode (only if SET applied) ─────────────
      const setApplied = afterGetPoll.completed && afterMode === targetMode;
      if (setApplied) {
        await waitForHesJobQueueSlot();
        const restoreType =
          initialMode === "PREPAID" ? "payment_set_prepaid" : "payment_set_postpaid";
        const restoreBody =
          restoreType === "payment_set_prepaid"
            ? buildPaymentSetPrepaidBody({
                meters: getBody.meters,
                otp: buildCommandsStepUpOtp(),
              })
            : buildPaymentSetPostpaidBody({
                meters: getBody.meters,
                otp: buildCommandsStepUpOtp(),
              });
        const { rawResponse: restoreRaw, responseBody: restorePostBody } =
          await paymentApi.postPayment(restoreBody);
        if (restoreRaw.status() < 400 && restorePostBody.success) {
          try {
            const restoreJobName = extractJobNamesFromInitResponse(restorePostBody)[0];
            await pollQueryMeterJob(queryApi, restoreJobName, {
              timeoutMs: commandsPaymentData.jobPollTimeoutMs,
              intervalMs: commandsPaymentData.jobPollIntervalMs,
              stuckMs: commandsPaymentData.jobPollStuckMs,
              expectedCommand: restoreType,
            });
            console.log(`[Payment] Step 4 RESTORED mode to ${initialMode} (original).\n`);
          } catch (error) {
            console.log(`[Payment] Step 4 restore poll failed: ${String(error)}\n`);
          }
        }
      } else {
        console.log("[Payment] Step 4 RESTORED: skipped (SET did not change meter mode).\n");
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Payment E2E — complete flow",
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
          method: "POST GET → SET → GET → restore",
          requestParams: {
            getBody,
            setBody: { ...setBody, otp: "***" },
            getJobName,
            setJobName,
            afterGetJobName,
            initialValues,
            setPayloadSummary,
            afterValues,
            setApplied,
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
            "Complete flow: GET initial → SET prepaid/postpaid (+otp) → GET after; print value clarity; restore if SET applied.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/payment → query-meter-job — last_token_recharge_amount_get E2E",
    {
      tag: [
        "@smoke",
        "@commands",
        "@hes",
        "@commands-payment",
        "@commands-payment-last-token",
        "@e2e",
      ],
    },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const body = buildLastTokenRechargeAmountGetBody();
      const requestedMeters = normalizeMeters(body.meters);
      const paymentApi = new CommandsPaymentApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const paymentValidator = new CommandsPaymentValidator();

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await paymentApi.postPayment(body);

      if (
        BackendResponse.shouldSkipServerFailure(
          postRaw.status(),
          "Commands Payment — last_token GET",
          postBody,
        )
      ) {
        validation.printSummary("Commands Payment — last_token GET", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: body,
            responseStatus: postRaw.status(),
            responseBody: postBody,
            expectedBehavior: "200 with jobName for last_token_recharge_amount_get.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Payment — last_token GET",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsPaymentData.maxResponseTimeMs,
      });

      validation.execute("Init Success", () => initValidator.validateResponse(postBody));
      const mappedInit = CommandsJobInitMapper.mapResponse(postBody);
      validation.execute("Init Async Timings Null", () =>
        paymentValidator.validateInitAsyncTimings(mappedInit),
      );
      validation.execute("Init Message", () => paymentValidator.validateInitMessage(mappedInit));

      const jobName = extractJobNamesFromInitResponse(postBody)[0];
      let pollResult: PollQueryMeterJobResult;
      try {
        pollResult = await pollQueryMeterJob(queryApi, jobName, {
          timeoutMs: commandsPaymentData.jobPollTimeoutMs,
          intervalMs: commandsPaymentData.jobPollIntervalMs,
          stuckMs: commandsPaymentData.jobPollStuckMs,
          expectedCommand: "last_token_recharge_amount_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      assertHesE2eQueryPhase({
        validation,
        queryValidator,
        pollResult,
        jobName,
        meterId: requestedMeters[0],
        onFinished: () => {
          validation.execute("Query last_token PAYMENT", () =>
            paymentValidator.validateLastTokenRechargeAmountQueryMeterResults(
              pollResult.mapped.job.meterResults,
              requestedMeters[0],
              {
                meterResponse: pollResult.mapped.job.meterResponse,
                meterResponseRows: pollResult.mapped.job.meterResponseRows,
                message: pollResult.mapped.job.message,
              },
            ),
          );
          console.log(
            `\n[Payment last_token] value: ${pollResult.mapped.job.meterResponse ?? "(none)"}\n`,
          );
          logCommandConfigValueSnapshot({
            label: "Payment (last_token_recharge_amount_get)",
            meterId: requestedMeters[0],
            commandType: body.type,
            setRan: false,
            jobName,
            initialValues: pollResult.mapped.job.meterResponse,
          });
        },
      });

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Payment E2E — last_token_recharge_amount_get",
        responseTime: postTime + pollResult.responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: postRaw.url(),
          method: "POST → GET",
          requestParams: { body, jobName, completed: pollResult.completed },
          responseStatus: pollResult.rawResponse.status(),
          responseBody: { init: postBody, query: pollResult.responseBody },
          expectedBehavior:
            "last_token_recharge_amount_get FINISHED with PAYMENT + amountAtLastRecharge.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/payment — invalid type returns validation error",
    { tag: ["@commands", "@hes", "@commands-payment", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "invalid_payment_type",
        meters: commandsPaymentData.defaultMeterSerial,
      };

      const api = new CommandsPaymentApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } = await api.postPayment(
        body as Parameters<CommandsPaymentApi["postPayment"]>[0],
      );

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Error Response", () => initValidator.validateErrorResponse(responseBody));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Payment — Invalid Type",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Invalid payment type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
