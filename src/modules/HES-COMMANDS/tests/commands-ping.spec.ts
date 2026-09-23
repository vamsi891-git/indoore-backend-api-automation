import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HES_COMMANDS_E2E_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsPingApi } from "../Api/commands-ping.api";
import { buildPingBody, commandsPingData, normalizeMeters } from "../Data/commands-ping.data";
import { CommandsPingMapper } from "../Mapper/commands-ping.mapper";
import { CommandsPingValidator } from "../Validator/commands-ping.validator";
import { waitForHesJobQueueSlot } from "../utils/commands-hes-queue.helper";
import { logCommandConfigValueSnapshot } from "../utils/commands-job-e2e.helper";

test.describe("HES Commands — Ping", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(HES_COMMANDS_E2E_TEST_TIMEOUT_MS);

  test(
    "Validate POST /commands/ping — sync connectivity (CONNECTED)",
    {
      tag: ["@smoke", "@commands", "@hes", "@commands-ping", "@e2e"],
    },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const body = buildPingBody();
      const requestedMeters = normalizeMeters(body.meters);
      const api = new CommandsPingApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsPingValidator();

      console.log(`\n[Ping] meter=${requestedMeters[0]}\n`);

      const { rawResponse, responseBody, responseTime } = await api.postPing(body);

      await PerformanceTracker.track(rawResponse, "Commands Ping", rawResponse.url(), responseTime);

      if (
        BackendResponse.shouldSkipServerFailure(rawResponse.status(), "Commands Ping", responseBody)
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands Ping", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "POST",
            requestParams: body,
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior: "200 with CONNECTED meter result for in-scope serial.",
          },
        });
        return;
      }

      if (!responseBody?.success || !responseBody.data) {
        validation.execute("Status", () =>
          assert.validateStatusCode(rawResponse, rawResponse.status(), responseBody),
        );
        validation.execute("Error Response", () => validator.validateErrorResponse(responseBody));
        ApiValidationHelper.finalize(validation, {
          apiName: "Commands Ping (rejected)",
          responseTime,
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "POST",
            requestParams: body,
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior: "200 with success:true and CONNECTED meter result.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Ping",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsPingData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () => validator.validateResponse(responseBody));

      const mapped = CommandsPingMapper.mapResponse(responseBody);
      const row = mapped.ping.meterResults.find((r) => r.meterId === requestedMeters[0]);

      console.log(`[Ping] status:  ${row?.status ?? "(none)"}`);
      console.log(`[Ping] state:   ${row?.state ?? "(none)"}`);
      console.log(`[Ping] message: ${mapped.message}\n`);

      if (row?.status === "FAILED" && validator.isTransientMeterFailure(row)) {
        validation.execute("Summary Counts", () =>
          validator.validateSummaryCounts(mapped.ping.summary),
        );
        validation.execute("Envelope", () => validator.validateEnvelope(mapped.ping));
        validation.execute("FAILED Meter Result (transient)", () =>
          validator.validateFailedMeterResult(row, requestedMeters[0]),
        );
        BackendResponse.logFinding(
          "HES ping FINISHED but meter FAILED (transient)",
          row.errorMessage ?? row.meterResponse ?? "comms / disconnected",
        );
      } else {
        validation.execute("Full Ping Contract", () =>
          validator.validateFullSuccessContract(mapped, requestedMeters[0]),
        );
      }

      logCommandConfigValueSnapshot({
        label: "Ping",
        meterId: requestedMeters[0],
        commandType: "ping",
        setRan: false,
        jobName: row?.jobName,
        initialValues: row?.meterResponse ?? row?.state ?? "(none)",
        setPayloadSummary: "n/a",
        afterValues: "n/a",
      });

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Ping",
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
            "200 sync SUCCESS with state CONNECTED, display State row, timings > 0 (or FAILED only for transient HES/meter).",
        },
      });
    },
  );

  test(
    "Validate POST /commands/ping — unknown meter is rejected",
    { tag: ["@commands", "@hes", "@commands-ping", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      await waitForHesJobQueueSlot();
      const body = buildPingBody({ meters: commandsPingData.unknownMeterSerial });
      const api = new CommandsPingApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsPingValidator();

      const { rawResponse, responseBody, responseTime } = await api.postPing(body);

      if (
        BackendResponse.shouldSkipServerFailure(
          rawResponse.status(),
          "Commands Ping — Unknown Meter",
          responseBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands Ping — Unknown Meter", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "POST",
            requestParams: body,
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior:
              "Unknown serial rejected (400/404 or success:false / rejectedMeters).",
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
        validation.execute("Error Response", () => validator.validateErrorResponse(responseBody));
      } else {
        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: "Commands Ping — Unknown Meter",
          rawResponse,
          responseBody,
          responseTime,
          maxResponseTimeMs: commandsPingData.maxResponseTimeMs,
        });
        validation.execute("Success envelope or rejected", () => {
          if (responseBody.success && responseBody.data) {
            const mapped = CommandsPingMapper.mapResponse(responseBody);
            const rejected =
              mapped.ping.summary.rejectedUnknown +
              mapped.ping.summary.rejectedOutOfScope +
              mapped.ping.summary.failed;
            if (rejected === 0) {
              BackendResponse.logFinding(
                "HES ping accepted unknown meter serial",
                `meter=${commandsPingData.unknownMeterSerial} successful=${mapped.ping.summary.successful}`,
              );
            } else {
              expect(rejected).toBeGreaterThan(0);
              expect(mapped.ping.successfulMeters).not.toContain(
                commandsPingData.unknownMeterSerial,
              );
            }
          } else {
            validator.validateErrorResponse(responseBody);
          }
        });
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Ping — Unknown Meter",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Unknown serial returns error or rejectedMeters / failed summary.",
        },
      });
    },
  );
});
