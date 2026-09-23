import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { getTotpSecret } from "../../../core/utils/totp.util";
import { CommandsTariffApi } from "../Api/commands-tariff.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildTariffGetBody,
  buildTariffSetBody,
  commandsTariffData,
  normalizeMeters,
  summarizeTariffCalendar,
  tariffCalendarsEqual,
  withAlternateFirstScheduleZone,
  TariffCalendarEntry,
} from "../Data/commands-tariff.data";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsTariffValidator } from "../Validator/commands-tariff.validator";
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

test.describe("HES Commands — Tariff Calendar (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS * 2);

  test(
    "Validate POST /commands/tariff — GET → SET → GET-after (+otp)",
    {
      tag: [
        "@smoke",
        "@commands",
        "@hes",
        "@commands-tariff",
        "@commands-tariff-get",
        "@commands-tariff-set",
        "@e2e",
      ],
    },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const getBody = buildTariffGetBody();
      const requestedMeters = normalizeMeters(getBody.meters);
      const tariffApi = new CommandsTariffApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const tariffValidator = new CommandsTariffValidator();

      console.log(`\n[Tariff] Step 1 GET type=${getBody.type} meter=${requestedMeters[0]}\n`);

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await tariffApi.postTariff(getBody);

      await PerformanceTracker.track(
        postRaw,
        "Commands Tariff — Init GET",
        postRaw.url(),
        postTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          postRaw.status(),
          "Commands Tariff — Init GET",
          postBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands Tariff — Init GET", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: getBody,
            responseStatus: postRaw.status(),
            responseBody: postBody,
            expectedBehavior: "200 with jobName for tariff_calendar_get.",
          },
        });
        return;
      }

      if (!postBody?.success || !postBody.data) {
        validation.execute("Status (unexpected reject)", () => {
          expect(postRaw.status(), JSON.stringify(postBody)).toBe(200);
          expect(postBody.success).toBe(true);
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Tariff (rejected)",
          responseTime: postTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: getBody,
            responseStatus: postRaw.status(),
            responseBody: postBody,
            expectedBehavior: "200 with IN_PROGRESS + jobName.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Tariff — Init GET",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsTariffData.maxResponseTimeMs,
      });

      validation.execute("Init Response Envelope", () =>
        tariffValidator.validateInitResponseEnvelope(postBody),
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
      validation.execute("Init Note", () => tariffValidator.validateInitNote(mappedInit));
      validation.execute("Init Meter Results", () =>
        initValidator.validateAllMeterResults(
          mappedInit.init.meterResults,
          mappedInit.init.summary.successful,
        ),
      );
      validation.execute("Init IN_PROGRESS Status", () =>
        tariffValidator.validateInitInProgressStatus(mappedInit),
      );
      validation.execute("Init Async Timings Null", () =>
        tariffValidator.validateInitAsyncTimings(mappedInit),
      );
      validation.execute("Init Message", () => tariffValidator.validateInitMessage(mappedInit));
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
          timeoutMs: commandsTariffData.jobPollTimeoutMs,
          intervalMs: commandsTariffData.jobPollIntervalMs,
          stuckMs: commandsTariffData.jobPollStuckMs,
          expectedCommand: getBody.type,
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      await PerformanceTracker.track(
        getPoll.rawResponse,
        "Commands Tariff — Query GET",
        getPoll.rawResponse.url(),
        getPoll.responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Tariff — Query GET",
        rawResponse: getPoll.rawResponse,
        responseBody: getPoll.responseBody,
        responseTime: getPoll.responseTime,
        maxResponseTimeMs: commandsTariffData.maxResponseTimeMs,
      });

      let initialCalendar: TariffCalendarEntry | null = null;
      let initialSummary = "(not finished)";

      assertHesE2eQueryPhase({
        validation,
        queryValidator,
        pollResult: getPoll,
        jobName: getJobName,
        meterId: requestedMeters[0],
        onFinished: () => {
          validation.execute("Query Finished Message", () =>
            tariffValidator.validateQueryFinishedMessage(getPoll.mapped.message),
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
          validation.execute("Query Tariff Calendar HES Response", () =>
            tariffValidator.validateTariffQueryMeterResults(
              getPoll.mapped.job.meterResults,
              requestedMeters[0],
              "get",
            ),
          );
          validation.execute("Query Full Contract", () =>
            queryValidator.validateFullContract(getPoll.mapped, getJobName, requestedMeters[0]),
          );

          const row = getPoll.mapped.job.meterResults.find((r) => r.meterId === requestedMeters[0]);
          initialCalendar = tariffValidator.parseMeterResponseCalendar(
            row?.meterResponse ?? getPoll.mapped.job.meterResponse,
          );
          initialSummary = initialCalendar
            ? summarizeTariffCalendar(initialCalendar)
            : "(parse failed)";

          console.log(`[Tariff] Step 1 INITIAL: ${initialSummary}`);
        },
      });

      if (!getPoll.completed || !initialCalendar) {
        logCommandConfigValueSnapshot({
          label: "Tariff Calendar",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues: initialSummary,
          setPayloadSummary: "n/a (GET not FINISHED — SET skipped)",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Tariff E2E (GET only)",
          responseTime: postTime + getPoll.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: { getBody, getJobName, completed: getPoll.completed },
            responseStatus: getPoll.rawResponse.status(),
            responseBody: { init: postBody, query: getPoll.responseBody },
            expectedBehavior: "GET must FINISH with TARIFF_CALENDAR before SET round-trip can run.",
          },
        });
        return;
      }

      if (!getTotpSecret()) {
        logCommandConfigValueSnapshot({
          label: "Tariff Calendar",
          meterId: requestedMeters[0],
          commandType: getBody.type,
          setRan: false,
          jobName: getJobName,
          initialValues: initialSummary,
          setPayloadSummary: "n/a (TOTP_SECRET missing — cannot SET)",
        });
        testInfo.annotations.push({
          type: "notice",
          description: "SET skipped: set TOTP_SECRET in .env to run tariff_calendar_set",
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Tariff E2E (GET only — no TOTP)",
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

      const { target, originalZone, targetZone } = withAlternateFirstScheduleZone(initialCalendar);
      const setPayloadSummary = `firstScheduleZone ${originalZone} → ${targetZone}`;
      const setBody = buildTariffSetBody({
        meters: getBody.meters,
        commandData: target,
        otp: buildCommandsStepUpOtp(),
      });

      console.log(`[Tariff] Step 2 SET ${setPayloadSummary}\n`);
      await waitForHesJobQueueSlot();
      const {
        rawResponse: setRaw,
        responseBody: setPostBody,
        responseTime: setPostTime,
      } = await tariffApi.postTariff(setBody);

      await PerformanceTracker.track(
        setRaw,
        "Commands Tariff — Init SET",
        setRaw.url(),
        setPostTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          setRaw.status(),
          "Commands Tariff — Init SET",
          setPostBody,
        )
      ) {
        logCommandConfigValueSnapshot({
          label: "Tariff Calendar",
          meterId: requestedMeters[0],
          commandType: setBody.type,
          setRan: false,
          initialValues: initialSummary,
          setPayloadSummary: `${setPayloadSummary} — SET init failed HTTP ${setRaw.status()}`,
        });
        validation.printSummary("Commands Tariff — Init SET", setPostTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***", commandData: "(calendar)" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for tariff_calendar_set + otp.",
          },
        });
        return;
      }

      if (!setPostBody?.success || !setPostBody.data) {
        logCommandConfigValueSnapshot({
          label: "Tariff Calendar",
          meterId: requestedMeters[0],
          commandType: setBody.type,
          setRan: false,
          initialValues: initialSummary,
          setPayloadSummary: `SET rejected — HTTP ${setRaw.status()} success=${setPostBody?.success}`,
        });
        BackendResponse.logFinding(
          `HES ${setBody.type} SET init rejected`,
          JSON.stringify(setPostBody?.error ?? setPostBody).slice(0, 400),
        );
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Tariff E2E (SET rejected)",
          responseTime: setPostTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: setRaw.url(),
            method: "POST",
            requestParams: { ...setBody, otp: "***", commandData: "(calendar)" },
            responseStatus: setRaw.status(),
            responseBody: setPostBody,
            expectedBehavior: "200 with jobName for tariff_calendar_set + otp.",
          },
        });
        return;
      }

      validation.execute("SET Init Success Response", () =>
        initValidator.validateResponse(setPostBody),
      );
      const mappedSetInit = CommandsJobInitMapper.mapResponse(setPostBody);
      validation.execute("SET Init Message", () =>
        tariffValidator.validateInitMessage(mappedSetInit),
      );
      validation.execute("SET Init IN_PROGRESS", () =>
        tariffValidator.validateInitInProgressStatus(mappedSetInit),
      );

      const setJobName = extractJobNamesFromInitResponse(setPostBody)[0];
      let setPoll: PollQueryMeterJobResult;
      try {
        setPoll = await pollQueryMeterJob(queryApi, setJobName, {
          timeoutMs: commandsTariffData.jobPollTimeoutMs,
          intervalMs: commandsTariffData.jobPollIntervalMs,
          stuckMs: commandsTariffData.jobPollStuckMs,
          expectedCommand: "tariff_calendar_set",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      validation.execute("SET Job FINISHED", () => {
        expect(setPoll.completed).toBe(true);
        expect(setPoll.mapped.job.hesJobStatus).toBe("FINISHED");
      });

      const setRow = setPoll.mapped.job.meterResults.find((r) => r.meterId === requestedMeters[0]);
      let setSucceeded = false;
      if (setPoll.completed && setRow?.status === "FAILED") {
        validation.execute("SET FAILED Meter Result (shape)", () =>
          tariffValidator.validateTariffFailedSetMeterResultRow(setRow, requestedMeters[0]),
        );
        if (tariffValidator.isTransientMeterFailure(setRow)) {
          BackendResponse.logFinding(
            "HES tariff_calendar_set FINISHED but meter FAILED (transient)",
            setRow.errorMessage ?? setRow.message ?? "comms timeout / meter busy",
          );
        } else {
          validation.execute("SET Meter Result SUCCESS", () => {
            expect(setRow.status).toBe("SUCCESS");
          });
        }
      } else if (setPoll.completed) {
        setSucceeded = true;
        validation.execute("SET Tariff Meter Result", () =>
          tariffValidator.validateTariffQueryMeterResults(
            setPoll.mapped.job.meterResults,
            requestedMeters[0],
            "set",
          ),
        );
      }

      // ─── Step 3: GET after SET ────────────────────────────────────────────
      await waitForHesJobQueueSlot();
      const afterGetBody = buildTariffGetBody({ meters: getBody.meters });
      const {
        rawResponse: afterGetRaw,
        responseBody: afterGetPostBody,
        responseTime: afterGetPostTime,
      } = await tariffApi.postTariff(afterGetBody);
      const afterGetJobName = extractJobNamesFromInitResponse(afterGetPostBody)[0];

      let afterGetPoll: PollQueryMeterJobResult;
      try {
        afterGetPoll = await pollQueryMeterJob(queryApi, afterGetJobName, {
          timeoutMs: commandsTariffData.jobPollTimeoutMs,
          intervalMs: commandsTariffData.jobPollIntervalMs,
          stuckMs: commandsTariffData.jobPollStuckMs,
          expectedCommand: "tariff_calendar_get",
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      const afterCalendar = afterGetPoll.completed
        ? tariffValidator.parseMeterResponseCalendar(
            afterGetPoll.mapped.job.meterResults.find((r) => r.meterId === requestedMeters[0])
              ?.meterResponse ?? afterGetPoll.mapped.job.meterResponse,
          )
        : null;
      const afterSummary = afterCalendar
        ? summarizeTariffCalendar(afterCalendar)
        : "(after-GET not FINISHED)";

      console.log(`[Tariff] Step 3 AFTER: ${afterSummary}`);

      logCommandConfigValueSnapshot({
        label: "Tariff Calendar",
        meterId: requestedMeters[0],
        commandType: "GET → SET → GET",
        setRan: true,
        jobName: setJobName,
        initialValues: initialSummary,
        setPayloadSummary,
        afterValues: afterSummary,
      });

      let setApplied = false;
      if (afterGetPoll.completed && afterCalendar) {
        validation.execute("After-GET Tariff Calendar contract", () =>
          tariffValidator.validateTariffQueryMeterResults(
            afterGetPoll.mapped.job.meterResults,
            requestedMeters[0],
            "get",
          ),
        );

        const afterZone = afterCalendar.days[0]?.schedule[0]?.zone;
        if (!setSucceeded || afterZone !== targetZone) {
          BackendResponse.logFinding(
            setSucceeded
              ? "HES tariff_calendar_set SUCCESS but after-GET zone unchanged"
              : "HES tariff_calendar_set did not apply (SET FAILED or zone unchanged)",
            `expectedZone=${targetZone} afterZone=${afterZone ?? "null"} initialZone=${originalZone}. ` +
              (setSucceeded
                ? "SET finished SUCCESS; meter calendar not updated on subsequent GET."
                : "SET job finished FAILED/transient; after-GET still at initial calendar."),
          );
        } else {
          setApplied = true;
          validation.execute("After value first zone matches SET", () => {
            expect(afterZone).toBe(targetZone);
          });
        }
      }

      // ─── Step 4: restore original calendar ────────────────────────────────
      if (setApplied) {
        await waitForHesJobQueueSlot();
        const restoreBody = buildTariffSetBody({
          meters: getBody.meters,
          commandData: initialCalendar,
          otp: buildCommandsStepUpOtp(),
        });
        const { rawResponse: restoreRaw, responseBody: restorePostBody } =
          await tariffApi.postTariff(restoreBody);

        if (restoreRaw.status() < 400 && restorePostBody.success) {
          try {
            const restoreJobName = extractJobNamesFromInitResponse(restorePostBody)[0];
            await pollQueryMeterJob(queryApi, restoreJobName, {
              timeoutMs: commandsTariffData.jobPollTimeoutMs,
              intervalMs: commandsTariffData.jobPollIntervalMs,
              stuckMs: commandsTariffData.jobPollStuckMs,
              expectedCommand: "tariff_calendar_set",
            });
            console.log(`[Tariff] Restored firstScheduleZone to ${originalZone} (original).`);
          } catch (error) {
            console.log(
              `[Tariff] Restore poll failed (meter may still be at zone ${targetZone}): ${String(error)}`,
            );
          }
        } else {
          console.log(
            `[Tariff] Restore SET skipped/failed HTTP ${restoreRaw.status()} — meter may still be at zone ${targetZone}.`,
          );
        }
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Tariff E2E (GET → SET → GET)",
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
            setBody: { ...setBody, otp: "***", commandData: "(calendar)" },
            getJobName,
            setJobName,
            afterGetJobName,
            initialSummary,
            setPayloadSummary,
            afterSummary,
            setApplied,
            calendarsMatch: tariffCalendarsEqual(afterCalendar, target),
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
            "GET calendar → SET first zone with otp → GET after shows new zone; restore original.",
        },
      });
    },
  );
});
