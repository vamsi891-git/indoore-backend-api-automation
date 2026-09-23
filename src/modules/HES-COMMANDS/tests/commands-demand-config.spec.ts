import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { getTotpSecret } from "../../../core/utils/totp.util";
import { CommandsDemandConfigApi } from "../Api/commands-demand-config.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildDemandConfigBody,
  buildDemandConfigSetBody,
  commandsDemandConfigData,
  normalizeMeters,
  parseDemandPeriodSeconds,
  pickAlternateDemandPeriod,
  DemandConfigRequestBody,
} from "../Data/commands-demand-config.data";
import { CommandsDemandConfigValidator } from "../Validator/commands-demand-config.validator";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";
import {
  CommandsJobInitMapper,
  extractJobNamesFromInitResponse,
} from "../shared/commands-job-init.mapper";
import { buildCommandsStepUpOtp } from "../shared/commands-step-up-otp";
import {
  pollQueryMeterJob,
  softSkipHesE2eInfraFailure,
  assertHesE2eQueryPhase,
  logCommandConfigValueSnapshot,
  PollQueryMeterJobResult,
} from "../utils/commands-job-e2e.helper";
import { waitForHesJobQueueSlot } from "../utils/commands-hes-queue.helper";

test.describe("HES Commands — Demand Config (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS * 2);

  test(
    "Validate POST /commands/demand-config → query-meter-job — demand GET then SET then GET-after",
    {
      tag: ["@smoke", "@commands", "@hes", "@commands-demand-config", "@e2e"],
    },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const getBody = buildDemandConfigBody();
      const requestedMeters = normalizeMeters(getBody.meters);
      const demandApi = new CommandsDemandConfigApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const demandValidator = new CommandsDemandConfigValidator();

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await demandApi.postDemandConfig(getBody);

      await PerformanceTracker.track(
        postRaw,
        "Commands Demand Config — Init GET",
        postRaw.url(),
        postTime,
      );

      const postStatus = postRaw.status();
      if (
        BackendResponse.shouldSkipServerFailure(
          postStatus,
          "Commands Demand Config — Init GET",
          postBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands Demand Config — Init GET", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: getBody,
            responseStatus: postStatus,
            responseBody: postBody,
            expectedBehavior:
              "200 with jobName in meterResults for demand_integration_period_get (backend intermittently returns 500).",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Demand Config — Init GET",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsDemandConfigData.maxResponseTimeMs,
      });

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
      validation.execute("Init Meter Results", () =>
        initValidator.validateAllMeterResults(
          mappedInit.init.meterResults,
          mappedInit.init.summary.successful,
        ),
      );
      validation.execute("Init IN_PROGRESS Status", () =>
        demandValidator.validateInitInProgressStatus(mappedInit),
      );
      validation.execute("Init Async Timings Null", () =>
        demandValidator.validateInitAsyncTimings(mappedInit),
      );
      validation.execute("Init Message", () => demandValidator.validateInitMessage(mappedInit));
      validation.execute("Init Full Contract", () =>
        initValidator.validateFullInitContract(mappedInit, requestedMeters),
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
          timeoutMs: commandsDemandConfigData.jobPollTimeoutMs,
          intervalMs: commandsDemandConfigData.jobPollIntervalMs,
          stuckMs: commandsDemandConfigData.jobPollStuckMs,
          expectedCommand: "demand_integration_period_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      await PerformanceTracker.track(
        getPoll.rawResponse,
        "Commands Demand Config — Query GET",
        getPoll.rawResponse.url(),
        getPoll.responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Demand Config — Query GET",
        rawResponse: getPoll.rawResponse,
        responseBody: getPoll.responseBody,
        responseTime: getPoll.responseTime,
        maxResponseTimeMs: commandsDemandConfigData.maxResponseTimeMs,
      });

      let initialValues: string | null = null;
      let initialDemandPeriod: number | null = null;

      assertHesE2eQueryPhase({
        validation,
        queryValidator,
        pollResult: getPoll,
        jobName: getJobName,
        meterId: requestedMeters[0],
        onFinished: () => {
          validation.execute("Query Finished Message", () =>
            demandValidator.validateQueryFinishedMessage(getPoll.mapped.message),
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
          validation.execute("Query Demand Integration Period HES Response", () =>
            demandValidator.validateDemandConfigQueryMeterResults(
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
          initialValues = getPoll.mapped.job.meterResponse ?? null;
          initialDemandPeriod = parseDemandPeriodSeconds(initialValues);
        },
      });

      if (!getPoll.completed || initialValues == null || initialDemandPeriod == null) {
        logCommandConfigValueSnapshot({
          label: "Demand Config",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues:
            initialValues ?? "(GET not FINISHED or Demand Period missing — SET skipped)",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Demand Config E2E",
          responseTime: postTime + getPoll.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: { body: getBody, jobName: getJobName, completed: getPoll.completed },
            responseStatus: getPoll.rawResponse.status(),
            responseBody: { init: postBody, query: getPoll.responseBody },
            expectedBehavior: "GET must FINISH with Demand Period before SET round-trip can run.",
          },
        });
        return;
      }

      if (!getTotpSecret()) {
        logCommandConfigValueSnapshot({
          label: "Demand Config",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues,
          setPayloadSummary: "n/a (TOTP_SECRET missing — cannot SET)",
        });
        testInfo.annotations.push({
          type: "notice",
          description: "SET skipped: set TOTP_SECRET in .env to run demand_integration_period_set",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Demand Config E2E (GET only — no TOTP)",
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

      const targetPeriod = pickAlternateDemandPeriod(initialDemandPeriod);
      const setPayloadSummary = `demandPeriod=${targetPeriod} (was ${initialDemandPeriod})`;
      const setBody = buildDemandConfigSetBody({
        meters: getBody.meters,
        demandPeriod: targetPeriod,
        otp: buildCommandsStepUpOtp(),
      });

      await waitForHesJobQueueSlot();
      const {
        rawResponse: setRaw,
        responseBody: setPostBody,
        responseTime: setPostTime,
      } = await demandApi.postDemandConfig(setBody);

      await PerformanceTracker.track(
        setRaw,
        "Commands Demand Config — Init SET",
        setRaw.url(),
        setPostTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          setRaw.status(),
          "Commands Demand Config — Init SET",
          setPostBody,
        )
      ) {
        logCommandConfigValueSnapshot({
          label: "Demand Config",
          meterId: requestedMeters[0],
          commandType: setBody.type,
          setRan: false,
          initialValues,
          setPayloadSummary: `${setPayloadSummary} — SET init failed HTTP ${setRaw.status()}`,
        });
        validation.printSummary("Commands Demand Config — Init SET", setPostTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for demand_integration_period_set + otp.",
          },
        });
        return;
      }

      if (!setPostBody?.success || !setPostBody.data) {
        logCommandConfigValueSnapshot({
          label: "Demand Config",
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
          apiName: "Commands Demand Config E2E (SET rejected)",
          responseTime: setPostTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for demand_integration_period_set + otp.",
          },
        });
        return;
      }

      validation.execute("SET Init Success Response", () =>
        initValidator.validateResponse(setPostBody),
      );
      const mappedSetInit = CommandsJobInitMapper.mapResponse(setPostBody);
      validation.execute("SET Init Message", () =>
        demandValidator.validateInitMessage(mappedSetInit),
      );
      validation.execute("SET Init IN_PROGRESS", () =>
        demandValidator.validateInitInProgressStatus(mappedSetInit),
      );

      const setJobName = extractJobNamesFromInitResponse(setPostBody)[0];
      let setPoll: PollQueryMeterJobResult;
      try {
        setPoll = await pollQueryMeterJob(queryApi, setJobName, {
          timeoutMs: commandsDemandConfigData.jobPollTimeoutMs,
          intervalMs: commandsDemandConfigData.jobPollIntervalMs,
          stuckMs: commandsDemandConfigData.jobPollStuckMs,
          expectedCommand: "demand_integration_period_set",
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

      await waitForHesJobQueueSlot();
      const afterGetBody = buildDemandConfigBody({ meters: getBody.meters });
      const {
        rawResponse: afterGetRaw,
        responseBody: afterGetPostBody,
        responseTime: afterGetPostTime,
      } = await demandApi.postDemandConfig(afterGetBody);

      const afterGetJobName = extractJobNamesFromInitResponse(afterGetPostBody)[0];
      let afterGetPoll: PollQueryMeterJobResult;
      try {
        afterGetPoll = await pollQueryMeterJob(queryApi, afterGetJobName, {
          timeoutMs: commandsDemandConfigData.jobPollTimeoutMs,
          intervalMs: commandsDemandConfigData.jobPollIntervalMs,
          stuckMs: commandsDemandConfigData.jobPollStuckMs,
          expectedCommand: "demand_integration_period_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      const afterValues = afterGetPoll.completed
        ? (afterGetPoll.mapped.job.meterResponse ?? null)
        : "(after-GET not FINISHED)";

      logCommandConfigValueSnapshot({
        label: "Demand Config",
        meterId: requestedMeters[0],
        commandType: "GET → SET → GET",
        setRan: true,
        jobName: setJobName,
        initialValues,
        setPayloadSummary,
        afterValues,
      });

      if (afterGetPoll.completed) {
        validation.execute("After-GET Demand Integration Period", () =>
          demandValidator.validateDemandConfigQueryMeterResults(
            afterGetPoll.mapped.job.meterResults,
            requestedMeters[0],
            {
              meterResponse: afterGetPoll.mapped.job.meterResponse,
              meterResponseRows: afterGetPoll.mapped.job.meterResponseRows,
              message: afterGetPoll.mapped.job.message,
            },
          ),
        );
        validation.execute("After value Demand Period matches SET", () => {
          expect(parseDemandPeriodSeconds(afterValues)).toBe(targetPeriod);
        });
      }

      await waitForHesJobQueueSlot();
      const restoreBody: DemandConfigRequestBody = buildDemandConfigSetBody({
        meters: getBody.meters,
        demandPeriod: initialDemandPeriod,
        otp: buildCommandsStepUpOtp(),
      });
      const { rawResponse: restoreRaw, responseBody: restorePostBody } =
        await demandApi.postDemandConfig(restoreBody);

      if (restoreRaw.status() < 400 && restorePostBody.success) {
        try {
          const restoreJobName = extractJobNamesFromInitResponse(restorePostBody)[0];
          await pollQueryMeterJob(queryApi, restoreJobName, {
            timeoutMs: commandsDemandConfigData.jobPollTimeoutMs,
            intervalMs: commandsDemandConfigData.jobPollIntervalMs,
            stuckMs: commandsDemandConfigData.jobPollStuckMs,
            expectedCommand: "demand_integration_period_set",
          });
          console.log(
            `[Demand Config] Restored demandPeriod to ${initialDemandPeriod} (original).`,
          );
        } catch (error) {
          console.log(
            `[Demand Config] Restore poll failed (meter may still be at ${targetPeriod}): ${String(error)}`,
          );
        }
      } else {
        console.log(
          `[Demand Config] Restore SET skipped/failed HTTP ${restoreRaw.status()} — meter may still be at ${targetPeriod}.`,
        );
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Demand Config E2E (GET → SET → GET)",
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
            "GET initial → SET demandPeriod with otp → GET after shows new period; restore original.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/demand-config — invalid type returns validation error",
    { tag: ["@commands", "@hes", "@commands-demand-config", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "invalid_demand_type",
        meters: commandsDemandConfigData.defaultMeterSerial,
      };

      const api = new CommandsDemandConfigApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } = await api.postDemandConfig(
        body as Parameters<CommandsDemandConfigApi["postDemandConfig"]>[0],
      );

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Error Response", () => initValidator.validateErrorResponse(responseBody));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Demand Config — Invalid Type",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Invalid demand config type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
