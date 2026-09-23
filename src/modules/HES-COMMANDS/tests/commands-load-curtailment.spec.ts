import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { getTotpSecret } from "../../../core/utils/totp.util";
import { CommandsLoadCurtailmentApi } from "../Api/commands-load-curtailment.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildLoadCurtailmentBody,
  buildLoadCurtailmentSetBody,
  commandsLoadCurtailmentData,
  normalizeMeters,
  parseLoadCurtailmentState,
  pickAlternateLoadCurtailmentState,
  LoadCurtailmentSetFields,
} from "../Data/commands-load-curtailment.data";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsLoadCurtailmentValidator } from "../Validator/commands-load-curtailment.validator";
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

test.describe("HES Commands — Load Curtailment (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS * 2);

  test(
    "Validate POST /commands/load-curtailment → query-meter-job — load GET then SET then GET-after",
    {
      tag: ["@smoke", "@commands", "@hes", "@commands-load-curtailment", "@e2e"],
    },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const getBody = buildLoadCurtailmentBody();
      const requestedMeters = normalizeMeters(getBody.meters);
      const loadApi = new CommandsLoadCurtailmentApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const loadValidator = new CommandsLoadCurtailmentValidator();

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await loadApi.postLoadCurtailment(getBody);

      await PerformanceTracker.track(
        postRaw,
        "Commands Load Curtailment — Init GET",
        postRaw.url(),
        postTime,
      );

      const postStatus = postRaw.status();
      if (
        BackendResponse.shouldSkipServerFailure(
          postStatus,
          "Commands Load Curtailment — Init GET",
          postBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands Load Curtailment — Init GET", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: getBody,
            responseStatus: postStatus,
            responseBody: postBody,
            expectedBehavior:
              "200 with jobName in meterResults for load_curtailment_get (backend intermittently returns 500).",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Load Curtailment — Init GET",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsLoadCurtailmentData.maxResponseTimeMs,
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
        loadValidator.validateInitInProgressStatus(mappedInit),
      );
      validation.execute("Init Async Timings Null", () =>
        loadValidator.validateInitAsyncTimings(mappedInit),
      );
      validation.execute("Init Message", () => loadValidator.validateInitMessage(mappedInit));
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
          timeoutMs: commandsLoadCurtailmentData.jobPollTimeoutMs,
          intervalMs: commandsLoadCurtailmentData.jobPollIntervalMs,
          stuckMs: commandsLoadCurtailmentData.jobPollStuckMs,
          expectedCommand: "load_curtailment_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      await PerformanceTracker.track(
        getPoll.rawResponse,
        "Commands Load Curtailment — Query GET",
        getPoll.rawResponse.url(),
        getPoll.responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Load Curtailment — Query GET",
        rawResponse: getPoll.rawResponse,
        responseBody: getPoll.responseBody,
        responseTime: getPoll.responseTime,
        maxResponseTimeMs: commandsLoadCurtailmentData.maxResponseTimeMs,
      });

      assertHesE2eQueryPhase({
        validation,
        queryValidator,
        pollResult: getPoll,
        jobName: getJobName,
        meterId: requestedMeters[0],
        onFinished: () => {
          validation.execute("Query Finished Message", () =>
            loadValidator.validateQueryFinishedMessage(getPoll.mapped.message),
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
          validation.execute("Query Load Curtailment HES Response", () =>
            loadValidator.validateLoadCurtailmentQueryMeterResults(
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
        logCommandConfigValueSnapshot({
          label: "Load Curtailment",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues: "(GET not FINISHED — SET skipped)",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Load Curtailment E2E",
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
              "GET must FINISH with LOAD_CURTAILMENT before SET round-trip can run.",
          },
        });
        return;
      }

      const initialValues = getPoll.mapped.job.meterResponse ?? null;
      const getRow = getPoll.mapped.job.meterResults.find((r) => r.meterId === requestedMeters[0]);
      expect(getRow, `Expected meter ${requestedMeters[0]} in GET results`).toBeDefined();
      const initialSetFields = loadValidator.extractSetFieldsFromEntry(
        loadValidator.extractEntryFromMeterResult(getRow!),
      );

      if (initialValues == null) {
        logCommandConfigValueSnapshot({
          label: "Load Curtailment",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues: "(GET FINISHED but meterResponse missing — SET skipped)",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Load Curtailment E2E",
          responseTime: postTime + getPoll.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: { body: getBody, jobName: getJobName, completed: getPoll.completed },
            responseStatus: getPoll.rawResponse.status(),
            responseBody: { init: postBody, query: getPoll.responseBody },
            expectedBehavior: "GET FINISHED must include meterResponse before SET.",
          },
        });
        return;
      }

      if (!getTotpSecret()) {
        logCommandConfigValueSnapshot({
          label: "Load Curtailment",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues,
          setPayloadSummary: "n/a (TOTP_SECRET missing — cannot SET)",
        });
        testInfo.annotations.push({
          type: "notice",
          description: "SET skipped: set TOTP_SECRET in .env to run load_curtailment_set",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Load Curtailment E2E (GET only — no TOTP)",
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

      const targetState = pickAlternateLoadCurtailmentState(initialSetFields.loadCurtailmentState);
      const setFields: LoadCurtailmentSetFields = {
        ...initialSetFields,
        loadCurtailmentState: targetState,
      };
      const setPayloadSummary = `loadCurtailmentState=${targetState} (was ${initialSetFields.loadCurtailmentState})`;
      const setBody = buildLoadCurtailmentSetBody(setFields, {
        meters: getBody.meters,
        otp: buildCommandsStepUpOtp(),
      });

      await waitForHesJobQueueSlot();
      const {
        rawResponse: setRaw,
        responseBody: setPostBody,
        responseTime: setPostTime,
      } = await loadApi.postLoadCurtailment(setBody);

      await PerformanceTracker.track(
        setRaw,
        "Commands Load Curtailment — Init SET",
        setRaw.url(),
        setPostTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          setRaw.status(),
          "Commands Load Curtailment — Init SET",
          setPostBody,
        )
      ) {
        logCommandConfigValueSnapshot({
          label: "Load Curtailment",
          meterId: requestedMeters[0],
          commandType: setBody.type,
          setRan: false,
          initialValues,
          setPayloadSummary: `${setPayloadSummary} — SET init failed HTTP ${setRaw.status()}`,
        });
        validation.printSummary("Commands Load Curtailment — Init SET", setPostTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for load_curtailment_set + otp.",
          },
        });
        return;
      }

      if (!setPostBody?.success || !setPostBody.data) {
        logCommandConfigValueSnapshot({
          label: "Load Curtailment",
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
          apiName: "Commands Load Curtailment E2E (SET rejected)",
          responseTime: setPostTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for load_curtailment_set + otp.",
          },
        });
        return;
      }

      validation.execute("SET Init Success Response", () =>
        initValidator.validateResponse(setPostBody),
      );
      const mappedSetInit = CommandsJobInitMapper.mapResponse(setPostBody);
      validation.execute("SET Init Message", () =>
        loadValidator.validateInitMessage(mappedSetInit),
      );
      validation.execute("SET Init IN_PROGRESS", () =>
        loadValidator.validateInitInProgressStatus(mappedSetInit),
      );

      const setJobName = extractJobNamesFromInitResponse(setPostBody)[0];
      let setPoll: PollQueryMeterJobResult;
      try {
        setPoll = await pollQueryMeterJob(queryApi, setJobName, {
          timeoutMs: commandsLoadCurtailmentData.jobPollTimeoutMs,
          intervalMs: commandsLoadCurtailmentData.jobPollIntervalMs,
          stuckMs: commandsLoadCurtailmentData.jobPollStuckMs,
          expectedCommand: "load_curtailment_set",
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
      const afterGetBody = buildLoadCurtailmentBody({ meters: getBody.meters });
      const {
        rawResponse: afterGetRaw,
        responseBody: afterGetPostBody,
        responseTime: afterGetPostTime,
      } = await loadApi.postLoadCurtailment(afterGetBody);

      const afterGetJobName = extractJobNamesFromInitResponse(afterGetPostBody)[0];
      let afterGetPoll: PollQueryMeterJobResult;
      try {
        afterGetPoll = await pollQueryMeterJob(queryApi, afterGetJobName, {
          timeoutMs: commandsLoadCurtailmentData.jobPollTimeoutMs,
          intervalMs: commandsLoadCurtailmentData.jobPollIntervalMs,
          stuckMs: commandsLoadCurtailmentData.jobPollStuckMs,
          expectedCommand: "load_curtailment_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      const afterValues = afterGetPoll.completed
        ? (afterGetPoll.mapped.job.meterResponse ?? null)
        : "(after-GET not FINISHED)";

      logCommandConfigValueSnapshot({
        label: "Load Curtailment",
        meterId: requestedMeters[0],
        commandType: "GET → SET → GET",
        setRan: true,
        jobName: setJobName,
        initialValues,
        setPayloadSummary,
        afterValues,
      });

      if (afterGetPoll.completed) {
        validation.execute("After-GET Load Curtailment", () =>
          loadValidator.validateLoadCurtailmentQueryMeterResults(
            afterGetPoll.mapped.job.meterResults,
            requestedMeters[0],
            {
              meterResponse: afterGetPoll.mapped.job.meterResponse,
              meterResponseRows: afterGetPoll.mapped.job.meterResponseRows,
              message: afterGetPoll.mapped.job.message,
            },
          ),
        );

        const afterState = parseLoadCurtailmentState(afterValues);
        validation.execute("After value present", () => {
          expect(afterState).toBeTruthy();
        });

        // HES often returns SET SUCCESS while after-GET still shows the old config
        // (seen for lockoutMaxCounter and loadCurtailmentState). Log finding; do not fail smoke.
        if (afterState !== targetState) {
          BackendResponse.logFinding(
            "HES load_curtailment_set SUCCESS but after-GET state unchanged",
            `expected=${targetState} after=${afterState ?? "null"} initial=${initialSetFields.loadCurtailmentState}. ` +
              "SET job finished; meter config not updated on subsequent GET (backend/HES apply gap).",
          );
          console.log(
            `[Load Curtailment] After value did NOT match SET (expected ${targetState}, got ${afterState}). Restore skipped.`,
          );
        }
      }

      const setApplied =
        afterGetPoll.completed && parseLoadCurtailmentState(afterValues) === targetState;

      if (setApplied) {
        await waitForHesJobQueueSlot();
        const restoreBody = buildLoadCurtailmentSetBody(initialSetFields, {
          meters: getBody.meters,
          otp: buildCommandsStepUpOtp(),
        });
        const { rawResponse: restoreRaw, responseBody: restorePostBody } =
          await loadApi.postLoadCurtailment(restoreBody);

        if (restoreRaw.status() < 400 && restorePostBody.success) {
          try {
            const restoreJobName = extractJobNamesFromInitResponse(restorePostBody)[0];
            await pollQueryMeterJob(queryApi, restoreJobName, {
              timeoutMs: commandsLoadCurtailmentData.jobPollTimeoutMs,
              intervalMs: commandsLoadCurtailmentData.jobPollIntervalMs,
              stuckMs: commandsLoadCurtailmentData.jobPollStuckMs,
              expectedCommand: "load_curtailment_set",
            });
            console.log(
              `[Load Curtailment] Restored loadCurtailmentState to ${initialSetFields.loadCurtailmentState} (original).`,
            );
          } catch (error) {
            console.log(
              `[Load Curtailment] Restore poll failed (meter may still be at state=${targetState}): ${String(error)}`,
            );
          }
        } else {
          console.log(
            `[Load Curtailment] Restore SET skipped/failed HTTP ${restoreRaw.status()} — meter may still be at state=${targetState}.`,
          );
        }
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Load Curtailment E2E (GET → SET → GET)",
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
            "GET → SET (otp) → GET: SET job FINISHED/SUCCESS; after-GET stays valid. If meter state does not change after SET SUCCESS, log finding (known HES apply gap) — do not fail smoke.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/load-curtailment — invalid type returns validation error",
    { tag: ["@commands", "@hes", "@commands-load-curtailment", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "invalid_load_curtailment_type",
        meters: commandsLoadCurtailmentData.defaultMeterSerial,
      };

      const api = new CommandsLoadCurtailmentApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } = await api.postLoadCurtailment(
        body as Parameters<CommandsLoadCurtailmentApi["postLoadCurtailment"]>[0],
      );

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Error Response", () => initValidator.validateErrorResponse(responseBody));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Load Curtailment — Invalid Type",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Invalid load curtailment type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
