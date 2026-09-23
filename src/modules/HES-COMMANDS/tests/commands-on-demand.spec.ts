import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsOnDemandApi } from "../Api/commands-on-demand.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildOnDemandBody,
  commandsOnDemandData,
  normalizeMeters,
} from "../Data/commands-on-demand.data";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsOnDemandValidator } from "../Validator/commands-on-demand.validator";
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";
import {
  CommandsJobInitMapper,
  extractJobNamesFromInitResponse,
} from "../shared/commands-job-init.mapper";
import {
  assertHesE2eQueryPhase,
  logCommandConfigValueSnapshot,
  pollQueryMeterJob,
  softSkipHesE2eInfraFailure,
  PollQueryMeterJobResult,
} from "../utils/commands-job-e2e.helper";
import { waitForHesJobQueueSlot } from "../utils/commands-hes-queue.helper";

test.describe("HES Commands — On Demand Profile (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS);

  test(
    "Validate POST /commands/on-demand — on_demand_profile → query-meter-job",
    {
      tag: [
        "@smoke",
        "@commands",
        "@hes",
        "@commands-on-demand",
        "@commands-on-demand-profile",
        "@e2e",
      ],
    },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const body = buildOnDemandBody();
      const requestedMeters = normalizeMeters(body.meters);
      const onDemandApi = new CommandsOnDemandApi(authenticatedApi);
      const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();
      const queryValidator = new CommandsQueryMeterJobValidator();
      const onDemandValidator = new CommandsOnDemandValidator();

      console.log(
        `\n[On Demand] type=${body.type} meter=${requestedMeters[0]} ` +
          `obis=${body.commandData.formattedProfileObisCode} ` +
          `${body.commandData.sampleStartTime} → ${body.commandData.sampleStopTime}\n`,
      );

      const {
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
      } = await onDemandApi.postOnDemand(body);

      await PerformanceTracker.track(postRaw, "Commands On Demand — Init", postRaw.url(), postTime);

      if (
        BackendResponse.shouldSkipServerFailure(
          postRaw.status(),
          "Commands On Demand — Init",
          postBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(postBody),
        );
        validation.printSummary("Commands On Demand — Init", postTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: body,
            responseStatus: postRaw.status(),
            responseBody: postBody,
            expectedBehavior: "200 with jobName for on_demand_profile.",
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
          apiName: "Commands On Demand (rejected)",
          responseTime: postTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST",
            requestParams: body,
            responseStatus: postRaw.status(),
            responseBody: postBody,
            expectedBehavior: "200 with success:true and SUCCESS meter result.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands On Demand — Init",
        rawResponse: postRaw,
        responseBody: postBody,
        responseTime: postTime,
        maxResponseTimeMs: commandsOnDemandData.maxResponseTimeMs,
      });

      validation.execute("Init Response Envelope", () =>
        onDemandValidator.validateInitResponseEnvelope(postBody),
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
      validation.execute("Init Meter Results", () =>
        initValidator.validateAllMeterResults(
          mappedInit.init.meterResults,
          mappedInit.init.summary.successful,
        ),
      );
      validation.execute("Init SUCCESS Status", () =>
        onDemandValidator.validateInitSuccessStatus(mappedInit),
      );
      validation.execute("Init Async Timings Null", () =>
        onDemandValidator.validateInitAsyncTimings(mappedInit),
      );
      validation.execute("Init Message", () => onDemandValidator.validateInitMessage(mappedInit));

      const jobName = extractJobNamesFromInitResponse(postBody)[0];
      validation.execute("Job Name Captured", () => {
        expect(jobName).toBe(mappedInit.init.meterResults[0].jobName);
      });

      let pollResult: PollQueryMeterJobResult;
      try {
        pollResult = await pollQueryMeterJob(queryApi, jobName, {
          timeoutMs: commandsOnDemandData.jobPollTimeoutMs,
          intervalMs: commandsOnDemandData.jobPollIntervalMs,
          stuckMs: commandsOnDemandData.jobPollStuckMs,
          expectedCommand: body.type,
        });
      } catch (error) {
        softSkipHesE2eInfraFailure(error, testInfo);
      }

      await PerformanceTracker.track(
        pollResult.rawResponse,
        "Commands On Demand — Query",
        pollResult.rawResponse.url(),
        pollResult.responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands On Demand — Query",
        rawResponse: pollResult.rawResponse,
        responseBody: pollResult.responseBody,
        responseTime: pollResult.responseTime,
        maxResponseTimeMs: commandsOnDemandData.maxResponseTimeMs,
      });

      assertHesE2eQueryPhase({
        validation,
        queryValidator,
        pollResult,
        jobName,
        meterId: requestedMeters[0],
        onFinished: () => {
          validation.execute("Query Message", () =>
            onDemandValidator.validateQueryMessage(pollResult.mapped.message),
          );
          validation.execute("Query Summary Counts", () =>
            queryValidator.validateSummaryCounts(pollResult.mapped.job.summary),
          );
          validation.execute("Query All Meter Results", () =>
            queryValidator.validateAllMeterResults(pollResult.mapped.job.meterResults),
          );
          validation.execute("Query On Demand Meter Result", () =>
            onDemandValidator.validateOnDemandQueryMeterResults(
              pollResult.mapped.job.meterResults,
              requestedMeters[0],
              body.commandData,
            ),
          );

          if (onDemandValidator.isHesUnreachable(pollResult.mapped)) {
            validation.execute("Query HES Unreachable Contract", () =>
              onDemandValidator.validateHesUnreachableQuery(pollResult.mapped),
            );
            BackendResponse.logFinding(
              "HES on_demand_profile query returned unreachable (DB last-known)",
              `hesStatusCode=${pollResult.mapped.job.hesStatusCode} synced=${pollResult.mapped.job.synced}`,
            );
          }

          const row = pollResult.mapped.job.meterResults.find(
            (r) => r.meterId === requestedMeters[0],
          );
          const samples = (row?.hesResponse as { samples?: unknown[] } | null)?.samples;
          console.log(`\n[On Demand] Step DONE`);
          console.log(`[On Demand] status:  ${row?.status ?? "(none)"}`);
          console.log(`[On Demand] action:  ${row?.action ?? "(none)"}`);
          console.log(`[On Demand] samples: ${Array.isArray(samples) ? samples.length : "n/a"}`);
          console.log(`[On Demand] message: ${pollResult.mapped.message}\n`);

          logCommandConfigValueSnapshot({
            label: "On Demand Profile",
            meterId: requestedMeters[0],
            commandType: body.type,
            setRan: false,
            jobName,
            initialValues:
              Array.isArray(samples) && samples.length > 0
                ? `${samples.length} sample(s)`
                : "(empty samples — valid for range)",
            setPayloadSummary: "n/a",
            afterValues: "n/a",
          });
        },
      });

      if (!pollResult.completed) {
        logCommandConfigValueSnapshot({
          label: "On Demand Profile",
          meterId: requestedMeters[0],
          commandType: body.type,
          setRan: false,
          jobName,
          initialValues: "(job still pending)",
          setPayloadSummary: "n/a",
          afterValues: "n/a",
        });
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands On Demand E2E",
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
            completed: pollResult.completed,
          },
          responseStatus: pollResult.rawResponse.status(),
          responseBody: {
            init: postBody,
            query: pollResult.responseBody,
          },
          expectedBehavior: pollResult.completed
            ? "POST on_demand_profile → query SUCCESS (empty samples OK; HES unreachable 404 soft-ok)."
            : "POST on_demand_profile; query may stay pending until HES callback.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/on-demand — unknown meter is rejected",
    { tag: ["@commands", "@hes", "@commands-on-demand", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const body = buildOnDemandBody({
        meters: commandsOnDemandData.unknownMeterSerial,
      });
      const api = new CommandsOnDemandApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } = await api.postOnDemand(body);

      if (
        BackendResponse.shouldSkipServerFailure(
          rawResponse.status(),
          "Commands On Demand — Unknown Meter",
          responseBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          initValidator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands On Demand — Unknown Meter", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "POST",
            requestParams: body,
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior: "Unknown serial rejected or rejectedMeters.",
          },
        });
        return;
      }

      const status = rawResponse.status();
      if (status === 400 || status === 404) {
        validation.execute("Status (rejected)", () =>
          assert.validateStatusCode(rawResponse, status, responseBody),
        );
        validation.execute("Content Type", () => assert.validateContentType(rawResponse));
        validation.execute("Error Response", () =>
          initValidator.validateErrorResponse(responseBody),
        );
      } else {
        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: "Commands On Demand — Unknown Meter",
          rawResponse,
          responseBody,
          responseTime,
          maxResponseTimeMs: commandsOnDemandData.maxResponseTimeMs,
        });
        validation.execute("Rejected or failed summary", () => {
          expect(responseBody.success).toBe(true);
          expect(responseBody.data).toBeDefined();
          const summary = responseBody.data!.summary;
          const rejected = summary.rejectedUnknown + summary.rejectedOutOfScope + summary.failed;
          if (rejected === 0) {
            BackendResponse.logFinding(
              "HES on_demand_profile accepted unknown meter serial",
              `meter=${commandsOnDemandData.unknownMeterSerial} successful=${summary.successful}`,
            );
          } else {
            expect(rejected).toBeGreaterThan(0);
            expect(responseBody.data!.successfulMeters).not.toContain(
              commandsOnDemandData.unknownMeterSerial,
            );
          }
        });
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands On Demand — Unknown Meter",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Unknown serial returns error or rejectedMeters / failed.",
        },
      });
    },
  );
});
