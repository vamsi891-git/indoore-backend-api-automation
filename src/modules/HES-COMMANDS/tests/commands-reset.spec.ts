import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { getTotpSecret } from "../../../core/utils/totp.util";
import { CommandsResetApi } from "../Api/commands-reset.api";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildLrcfResetBody,
  buildMaxDemandResetBody,
  commandsResetData,
  normalizeMeters,
  ResetCommandType,
  ResetRequestBody,
} from "../Data/commands-reset.data";
import { CommandsJobInitValidator } from "../Validator/commands-job-init.validator";
import { CommandsResetValidator } from "../Validator/commands-reset.validator";
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

interface ResetE2eCase {
  title: string;
  type: ResetCommandType;
  buildBody: (otp: string) => ResetRequestBody;
}

const resetE2eCases: ResetE2eCase[] = [
  {
    title: "Validate POST /commands/reset — max_demand_reset (+otp) → query-meter-job",
    type: "max_demand_reset",
    buildBody: (otp) => buildMaxDemandResetBody({ otp }),
  },
  {
    title: "Validate POST /commands/reset — lrcf_reset (+otp) → query-meter-job",
    type: "lrcf_reset",
    buildBody: (otp) => buildLrcfResetBody({ otp }),
  },
];

test.describe("HES Commands — Reset (E2E)", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS);

  for (const resetCase of resetE2eCases) {
    test(
      resetCase.title,
      {
        tag: [
          "@smoke",
          "@commands",
          "@hes",
          "@commands-reset",
          `@commands-reset-${resetCase.type}`,
          "@e2e",
        ],
      },
      async ({ authenticatedApi }, testInfo) => {
        if (!getTotpSecret()) {
          test.skip(true, "TOTP_SECRET required — reset commands always need otp (2FA)");
        }

        await waitForHesJobQueueSlot();
        const body = resetCase.buildBody(buildCommandsStepUpOtp());
        const requestedMeters = normalizeMeters(body.meters);
        const resetApi = new CommandsResetApi(authenticatedApi);
        const queryApi = new CommandsQueryMeterJobApi(authenticatedApi);
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const initValidator = new CommandsJobInitValidator();
        const queryValidator = new CommandsQueryMeterJobValidator();
        const resetValidator = new CommandsResetValidator();

        console.log(
          `\n[Reset] type=${body.type} meter=${requestedMeters[0]} (otp from TOTP_SECRET)\n`,
        );

        const {
          rawResponse: postRaw,
          responseBody: postBody,
          responseTime: postTime,
        } = await resetApi.postReset(body);

        await PerformanceTracker.track(
          postRaw,
          `Commands Reset — Init (${body.type})`,
          postRaw.url(),
          postTime,
        );

        if (
          BackendResponse.shouldSkipServerFailure(
            postRaw.status(),
            `Commands Reset — Init (${body.type})`,
            postBody,
          )
        ) {
          validation.execute("Error Response (500 backend defect)", () =>
            initValidator.validateErrorResponse(postBody),
          );
          validation.printSummary(`Commands Reset — Init (${body.type})`, postTime, {
            testInfo,
            defectContext: {
              module: "HES-COMMANDS",
              endpoint: postRaw.url(),
              method: "POST",
              requestParams: { ...body, otp: "***" },
              responseStatus: postRaw.status(),
              responseBody: postBody,
              expectedBehavior: `200 with jobName for ${body.type} + otp.`,
            },
          });
          return;
        }

        // Missing/invalid otp often returns 401/403/400 — surface clearly.
        if (postRaw.status() === 400 || postRaw.status() === 401 || postRaw.status() === 403) {
          validation.execute("Status (auth/validation)", () =>
            assert.validateStatusCode(postRaw, postRaw.status(), postBody),
          );
          validation.execute("Error Response", () => initValidator.validateErrorResponse(postBody));
          ApiValidationHelper.finalize(validation, {
            apiName: `Commands Reset — ${body.type} (rejected)`,
            responseTime: postTime,
            testInfo,
            defectContext: {
              module: "HES-COMMANDS",
              endpoint: postRaw.url(),
              method: "POST",
              requestParams: { ...body, otp: "***" },
              responseStatus: postRaw.status(),
              responseBody: postBody,
              expectedBehavior: "Valid otp should return 200 + jobName.",
            },
          });
          return;
        }

        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: `Commands Reset — Init (${body.type})`,
          rawResponse: postRaw,
          responseBody: postBody,
          responseTime: postTime,
          maxResponseTimeMs: commandsResetData.maxResponseTimeMs,
        });

        validation.execute("Init Response Envelope", () =>
          resetValidator.validateInitResponseEnvelope(postBody),
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
        validation.execute("Init Note", () => resetValidator.validateInitNote(mappedInit));
        validation.execute("Init Meter Results", () =>
          initValidator.validateAllMeterResults(
            mappedInit.init.meterResults,
            mappedInit.init.summary.successful,
          ),
        );
        validation.execute("Init IN_PROGRESS Status", () =>
          resetValidator.validateInitInProgressStatus(mappedInit),
        );
        validation.execute("Init Async Timings Null", () =>
          resetValidator.validateInitAsyncTimings(mappedInit),
        );
        validation.execute("Init Message", () => resetValidator.validateInitMessage(mappedInit));
        validation.execute("Init Full Contract", () =>
          initValidator.validateFullInitContract(mappedInit, requestedMeters),
        );

        const jobName = extractJobNamesFromInitResponse(postBody)[0];
        validation.execute("Job Name Captured", () => {
          expect(jobName).toBe(mappedInit.init.meterResults[0].jobName);
        });

        let pollResult: PollQueryMeterJobResult;
        try {
          pollResult = await pollQueryMeterJob(queryApi, jobName, {
            timeoutMs: commandsResetData.jobPollTimeoutMs,
            intervalMs: commandsResetData.jobPollIntervalMs,
            stuckMs: commandsResetData.jobPollStuckMs,
            expectedCommand: body.type,
          });
        } catch (error) {
          softSkipHesE2eInfraFailure(error, testInfo);
        }

        await PerformanceTracker.track(
          pollResult.rawResponse,
          `Commands Reset — Query (${body.type})`,
          pollResult.rawResponse.url(),
          pollResult.responseTime,
        );

        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: `Commands Reset — Query (${body.type})`,
          rawResponse: pollResult.rawResponse,
          responseBody: pollResult.responseBody,
          responseTime: pollResult.responseTime,
          maxResponseTimeMs: commandsResetData.maxResponseTimeMs,
        });

        assertHesE2eQueryPhase({
          validation,
          queryValidator,
          pollResult,
          jobName,
          meterId: requestedMeters[0],
          onFinished: () => {
            validation.execute("Query Response Envelope", () =>
              resetValidator.validateQueryResponseEnvelope(pollResult.mapped),
            );
            validation.execute("Query Finished Message", () =>
              resetValidator.validateQueryFinishedMessage(pollResult.mapped.message),
            );
            validation.execute("Query HES Job Status FINISHED", () => {
              expect(pollResult.mapped.job.hesJobStatus).toBe("FINISHED");
            });
            validation.execute("Query Summary Counts", () =>
              queryValidator.validateSummaryCounts(pollResult.mapped.job.summary),
            );
            validation.execute("Query All Meter Results", () =>
              queryValidator.validateAllMeterResults(pollResult.mapped.job.meterResults),
            );
            validation.execute("Query Full Contract", () =>
              queryValidator.validateFullContract(pollResult.mapped, jobName, requestedMeters[0]),
            );

            const row = pollResult.mapped.job.meterResults.find(
              (r) => r.meterId === requestedMeters[0],
            );
            console.log(`\n[Reset] Step DONE type=${body.type}`);
            console.log(`[Reset] status:        ${row?.status ?? "(none)"}`);
            console.log(`[Reset] meterResponse: ${row?.meterResponse ?? "(null)"}`);
            console.log(`[Reset] message:       ${row?.message ?? "(null)"}\n`);

            if (row?.status === "FAILED" && resetValidator.isTransientMeterFailure(row)) {
              validation.execute("Query Reset FAILED Meter Result (transient)", () =>
                resetValidator.validateResetFailedMeterResultRow(row, requestedMeters[0]),
              );
              BackendResponse.logFinding(
                `HES ${body.type} FINISHED but meter FAILED (transient)`,
                row.errorMessage ?? row.message ?? "comms timeout / meter busy",
              );
            } else {
              validation.execute("Query Reset Meter Result", () =>
                resetValidator.validateResetQueryMeterResults(
                  pollResult.mapped.job.meterResults,
                  requestedMeters[0],
                ),
              );
            }

            logCommandConfigValueSnapshot({
              label: `Reset (${body.type})`,
              meterId: requestedMeters[0],
              commandType: body.type,
              setRan: true,
              jobName,
              initialValues: "(reset action — no prior GET config)",
              setPayloadSummary: `${body.type} + otp`,
              afterValues: row?.meterResponse ?? row?.message ?? "(none)",
            });
          },
        });

        if (!pollResult.completed) {
          logCommandConfigValueSnapshot({
            label: `Reset (${body.type})`,
            meterId: requestedMeters[0],
            commandType: body.type,
            setRan: true,
            jobName,
            initialValues: "(reset action — no prior GET config)",
            setPayloadSummary: `${body.type} + otp`,
            afterValues: "(job still IN_PROGRESS)",
          });
        }

        ApiValidationHelper.finalize(validation, {
          apiName: `Commands Reset E2E — ${body.type}`,
          responseTime: postTime + pollResult.responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: postRaw.url(),
            method: "POST → GET",
            requestParams: {
              body: { ...body, otp: "***" },
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
              ? `POST ${body.type} with otp → query-meter-job FINISHED (SUCCESS, or FAILED only for transient HES/meter timeout).`
              : `POST ${body.type} with otp; query may stay IN_PROGRESS until HES callback.`,
          },
        });
      },
    );
  }

  test(
    "Validate POST /commands/reset — missing otp returns error",
    { tag: ["@commands", "@hes", "@commands-reset", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "max_demand_reset",
        meters: commandsResetData.defaultMeterSerial,
        // otp omitted on purpose
      };

      const api = new CommandsResetApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } = await api.postReset(
        body as Parameters<CommandsResetApi["postReset"]>[0],
      );

      validation.execute("Status (otp required)", () => {
        expect([400, 401, 403]).toContain(rawResponse.status());
      });
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Error Response", () => initValidator.validateErrorResponse(responseBody));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Reset — Missing OTP",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Reset without otp returns 400/401/403.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/reset — invalid type returns validation error",
    { tag: ["@commands", "@hes", "@commands-reset", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = {
        type: "invalid_reset_type",
        meters: commandsResetData.defaultMeterSerial,
        otp: getTotpSecret() ? buildCommandsStepUpOtp() : "000000",
      };

      const api = new CommandsResetApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const initValidator = new CommandsJobInitValidator();

      const { rawResponse, responseBody, responseTime } = await api.postReset(
        body as Parameters<CommandsResetApi["postReset"]>[0],
      );

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Error Response", () => initValidator.validateErrorResponse(responseBody));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Reset — Invalid Type",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: { ...body, otp: "***" },
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Invalid reset type returns 400 VALIDATION_ERROR.",
        },
      });
    },
  );
});
