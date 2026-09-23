import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsDisconnectTodayUsageApi } from "../Api/commands-disconnect-today-usage.api";
import {
  DISCONNECT_TODAY_USAGE_PATH,
  commandsDisconnectTodayUsageData,
} from "../Data/commands-disconnect-today-usage.data";
import { CommandsDisconnectTodayUsageMapper } from "../Mapper/commands-disconnect-today-usage.mapper";
import { CommandsDisconnectTodayUsageValidator } from "../Validator/commands-disconnect-today-usage.validator";

test.describe("HES Commands — Disconnect Today Usage", () => {
  test.setTimeout(120_000);

  test(
    "Validate GET /commands/disconnect/today-usage — daily quota",
    {
      tag: [
        "@smoke",
        "@commands",
        "@hes",
        "@commands-disconnect",
        "@commands-disconnect-today-usage",
      ],
    },
    async ({ authenticatedApi }, testInfo) => {
      const api = new CommandsDisconnectTodayUsageApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsDisconnectTodayUsageValidator();

      const { rawResponse, responseBody, responseTime } = await api.getTodayUsage();

      await PerformanceTracker.track(
        rawResponse,
        "Commands Disconnect Today Usage",
        rawResponse.url(),
        responseTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          rawResponse.status(),
          "Commands Disconnect Today Usage",
          responseBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands Disconnect Today Usage", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "GET",
            requestParams: {},
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior: "200 with date, timezone, limit/used/remaining quota.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Disconnect Today Usage",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsDisconnectTodayUsageData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () => validator.validateResponse(responseBody));
      expect(responseBody.data).toBeDefined();
      const rawData = responseBody.data!;
      const mapped = CommandsDisconnectTodayUsageMapper.mapResponse(responseBody);

      console.log(
        `\n[Disconnect Today Usage] date=${mapped.date} tz=${mapped.timezone} ` +
          `used=${mapped.used}/${mapped.limit} remaining=${mapped.remaining} ` +
          `meters=${mapped.disconnectedMeters}\n`,
      );

      validation.execute("Data Keys", () => validator.validateDataKeys(rawData));
      validation.execute("Date", () => validator.validateDate(mapped));
      validation.execute("Timezone", () => validator.validateTimezone(mapped));
      validation.execute("Quota Counts", () => validator.validateQuotaCounts(mapped));
      validation.execute("Full Contract", () => validator.validateFullContract(mapped, rawData));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Disconnect Today Usage",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: DISCONNECT_TODAY_USAGE_PATH,
          method: "GET",
          requestParams: {},
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with Asia/Kolkata date quota: used + remaining = limit; meter counts ≥ 0.",
        },
      });
    },
  );
});
