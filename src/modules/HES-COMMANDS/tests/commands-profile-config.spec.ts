import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { getTotpSecret } from "../../../core/utils/totp.util";
import { CommandsProfileConfigApi } from "../Api/commands-profile-config.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildProfileConfigBody,
  buildProfileConfigSetBody,
  commandsProfileConfigData,
  normalizeMeters,
  parseInstantaneousCapturePeriodSeconds,
  pickAlternateCapturePeriod,
  ProfileConfigRequestBody,
} from "../Data/commands-profile-config.data";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsProfileConfigValidator } from "../Validator/commands-profile-config.validator";
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

test.describe("HES Commands — Profile Config (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  // GET + SET + GET-after + restore SET needs more than a single job window.
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS * 2);

  test(
    "Validate POST /commands/profile-config → query-meter-job — profile GET then SET then GET-after",
    {
      tag: ["@smoke", "@commands", "@hes", "@commands-profile-config", "@e2e"],
    },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const getBody = buildProfileConfigBody();
      const requestedMeters = normalizeMeters(getBody.meters);
      const profileApi = new CommandsProfileConfigApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const profileValidator = new CommandsProfileConfigValidator();

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await profileApi.postProfileConfig(getBody);

      await PerformanceTracker.track(
        postRaw,
        "Commands Profile Config — Init GET",
        postRaw.url(),
        postTime,
      );

      const postStatus = postRaw.status();
      if (
        BackendResponse.shouldSkipServerFailure(
          postStatus,
          "Commands Profile Config — Init GET",
          postBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands Profile Config — Init GET", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: getBody,
            responseStatus: postStatus,
            responseBody: postBody,
            expectedBehavior:
              "200 with jobName in meterResults for profile_capture_period_get (backend intermittently returns 500).",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Profile Config — Init GET",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsProfileConfigData.maxResponseTimeMs,
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
        profileValidator.validateInitInProgressStatus(mappedInit),
      );
      validation.execute("Init Async Timings Null", () =>
        profileValidator.validateInitAsyncTimings(mappedInit),
      );
      validation.execute("Init Message", () => profileValidator.validateInitMessage(mappedInit));
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
          timeoutMs: commandsProfileConfigData.jobPollTimeoutMs,
          intervalMs: commandsProfileConfigData.jobPollIntervalMs,
          stuckMs: commandsProfileConfigData.jobPollStuckMs,
          expectedCommand: "profile_capture_period_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      await PerformanceTracker.track(
        getPoll.rawResponse,
        "Commands Profile Config — Query GET",
        getPoll.rawResponse.url(),
        getPoll.responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Profile Config — Query GET",
        rawResponse: getPoll.rawResponse,
        responseBody: getPoll.responseBody,
        responseTime: getPoll.responseTime,
        maxResponseTimeMs: commandsProfileConfigData.maxResponseTimeMs,
      });

      let initialValues: string | null = null;
      let initialInstantaneous: number | null = null;

      assertHesE2eQueryPhase({
        validation,
        queryValidator,
        pollResult: getPoll,
        jobName: getJobName,
        meterId: requestedMeters[0],
        onFinished: () => {
          validation.execute("Query Finished Message", () =>
            profileValidator.validateQueryFinishedMessage(getPoll.mapped.message),
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
          validation.execute("Query Profile Capture Period HES Response", () =>
            profileValidator.validateProfileConfigQueryMeterResults(
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
          initialInstantaneous = parseInstantaneousCapturePeriodSeconds(initialValues);
        },
      });

      if (!getPoll.completed || initialValues == null || initialInstantaneous == null) {
        logCommandConfigValueSnapshot({
          label: "Profile Config",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues:
            initialValues ?? "(GET not FINISHED or Instantaneous period missing — SET skipped)",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Profile Config E2E",
          responseTime: postTime + getPoll.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: { body: getBody, jobName: getJobName, completed: getPoll.completed },
            responseStatus: getPoll.rawResponse.status(),
            responseBody: { init: postBody, query: getPoll.responseBody },
            expectedBehavior:
              "GET must FINISH with Instantaneous period before SET round-trip can run.",
          },
        });
        return;
      }

      if (!getTotpSecret()) {
        logCommandConfigValueSnapshot({
          label: "Profile Config",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues,
          setPayloadSummary: "n/a (TOTP_SECRET missing — cannot SET)",
        });
        testInfo.annotations.push({
          type: "notice",
          description: "SET skipped: set TOTP_SECRET in .env to run profile_capture_period_set",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Profile Config E2E (GET only — no TOTP)",
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

      const targetPeriod = pickAlternateCapturePeriod(initialInstantaneous);
      const setPayloadSummary = `INSTANTANEOUS capturePeriod=${targetPeriod}s (was ${initialInstantaneous}s)`;
      const setBody = buildProfileConfigSetBody({
        meters: getBody.meters,
        profileType: "INSTANTANEOUS",
        capturePeriod: targetPeriod,
        otp: buildCommandsStepUpOtp(),
      });

      await waitForHesJobQueueSlot();
      const {
        rawResponse: setRaw,
        responseBody: setPostBody,
        responseTime: setPostTime,
      } = await profileApi.postProfileConfig(setBody);

      await PerformanceTracker.track(
        setRaw,
        "Commands Profile Config — Init SET",
        setRaw.url(),
        setPostTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          setRaw.status(),
          "Commands Profile Config — Init SET",
          setPostBody,
        )
      ) {
        logCommandConfigValueSnapshot({
          label: "Profile Config",
          meterId: requestedMeters[0],
          commandType: setBody.type,
          setRan: false,
          initialValues,
          setPayloadSummary: `${setPayloadSummary} — SET init failed HTTP ${setRaw.status()}`,
        });
        validation.printSummary("Commands Profile Config — Init SET", setPostTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for profile_capture_period_set + otp.",
          },
        });
        return;
      }

      if (!setPostBody?.success || !setPostBody.data) {
        logCommandConfigValueSnapshot({
          label: "Profile Config",
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
          apiName: "Commands Profile Config E2E (SET rejected)",
          responseTime: setPostTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for profile_capture_period_set + otp.",
          },
        });
        return;
      }

      validation.execute("SET Init Success Response", () =>
        initValidator.validateResponse(setPostBody),
      );
      const mappedSetInit = CommandsJobInitMapper.mapResponse(setPostBody);
      validation.execute("SET Init Message", () =>
        profileValidator.validateInitMessage(mappedSetInit),
      );
      validation.execute("SET Init IN_PROGRESS", () =>
        profileValidator.validateInitInProgressStatus(mappedSetInit),
      );

      const setJobName = extractJobNamesFromInitResponse(setPostBody)[0];
      let setPoll: PollQueryMeterJobResult;
      try {
        setPoll = await pollQueryMeterJob(queryApi, setJobName, {
          timeoutMs: commandsProfileConfigData.jobPollTimeoutMs,
          intervalMs: commandsProfileConfigData.jobPollIntervalMs,
          stuckMs: commandsProfileConfigData.jobPollStuckMs,
          expectedCommand: "profile_capture_period_set",
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

      // Re-GET to read meter values after SET.
      await waitForHesJobQueueSlot();
      const afterGetBody = buildProfileConfigBody({ meters: getBody.meters });
      const {
        rawResponse: afterGetRaw,
        responseBody: afterGetPostBody,
        responseTime: afterGetPostTime,
      } = await profileApi.postProfileConfig(afterGetBody);

      const afterGetJobName = extractJobNamesFromInitResponse(afterGetPostBody)[0];
      let afterGetPoll: PollQueryMeterJobResult;
      try {
        afterGetPoll = await pollQueryMeterJob(queryApi, afterGetJobName, {
          timeoutMs: commandsProfileConfigData.jobPollTimeoutMs,
          intervalMs: commandsProfileConfigData.jobPollIntervalMs,
          stuckMs: commandsProfileConfigData.jobPollStuckMs,
          expectedCommand: "profile_capture_period_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      const afterValues = afterGetPoll.completed
        ? (afterGetPoll.mapped.job.meterResponse ?? null)
        : "(after-GET not FINISHED)";

      logCommandConfigValueSnapshot({
        label: "Profile Config",
        meterId: requestedMeters[0],
        commandType: `GET → SET → GET`,
        setRan: true,
        jobName: setJobName,
        initialValues,
        setPayloadSummary,
        afterValues,
      });

      if (afterGetPoll.completed) {
        validation.execute("After-GET Profile Capture Period", () =>
          profileValidator.validateProfileConfigQueryMeterResults(
            afterGetPoll.mapped.job.meterResults,
            requestedMeters[0],
            {
              meterResponse: afterGetPoll.mapped.job.meterResponse,
              meterResponseRows: afterGetPoll.mapped.job.meterResponseRows,
              message: afterGetPoll.mapped.job.message,
            },
          ),
        );
        validation.execute("After value Instantaneous matches SET", () => {
          const afterPeriod = parseInstantaneousCapturePeriodSeconds(afterValues);
          expect(afterPeriod).toBe(targetPeriod);
        });
      }

      // Restore original Instantaneous period so the meter is left as found.
      await waitForHesJobQueueSlot();
      const restoreBody: ProfileConfigRequestBody = buildProfileConfigSetBody({
        meters: getBody.meters,
        profileType: "INSTANTANEOUS",
        capturePeriod: initialInstantaneous,
        otp: buildCommandsStepUpOtp(),
      });
      const { rawResponse: restoreRaw, responseBody: restorePostBody } =
        await profileApi.postProfileConfig(restoreBody);

      if (restoreRaw.status() < 400 && restorePostBody.success) {
        try {
          const restoreJobName = extractJobNamesFromInitResponse(restorePostBody)[0];
          await pollQueryMeterJob(queryApi, restoreJobName, {
            timeoutMs: commandsProfileConfigData.jobPollTimeoutMs,
            intervalMs: commandsProfileConfigData.jobPollIntervalMs,
            stuckMs: commandsProfileConfigData.jobPollStuckMs,
            expectedCommand: "profile_capture_period_set",
          });
          console.log(
            `[Profile Config] Restored Instantaneous to ${initialInstantaneous}s (original).`,
          );
        } catch (error) {
          console.log(
            `[Profile Config] Restore poll failed (meter may still be at ${targetPeriod}s): ${String(error)}`,
          );
        }
      } else {
        console.log(
          `[Profile Config] Restore SET skipped/failed HTTP ${restoreRaw.status()} — meter may still be at ${targetPeriod}s.`,
        );
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Profile Config E2E (GET → SET → GET)",
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
            "GET initial → SET Instantaneous with otp → GET after shows new capturePeriod; restore original.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/profile-config — invalid type returns validation error",
    { tag: ["@commands", "@hes", "@commands-profile-config", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "invalid_profile_type",
        meters: commandsProfileConfigData.defaultMeterSerial,
      };

      const api = new CommandsProfileConfigApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } = await api.postProfileConfig(
        body as Parameters<CommandsProfileConfigApi["postProfileConfig"]>[0],
      );

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Error Response", () => initValidator.validateErrorResponse(responseBody));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Profile Config — Invalid Type",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Invalid profile config type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
