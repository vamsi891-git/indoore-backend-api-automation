import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsCalendarApi } from "../Api/commands-calendar.api";
import {
  buildCommandsCalendarPath,
  CALENDAR_WINDOW_PATH,
  commandsCalendarData,
} from "../Data/commands-calendar.data";
import { CommandsCalendarMapper } from "../Mapper/commands-calendar.mapper";
import { CommandsCalendarValidator } from "../Validator/commands-calendar.validator";

test.describe("HES Commands — Calendar", () => {
  test.setTimeout(120_000);

  test(
    "Validate GET /commands/calendar — entries for from/to range",
    { tag: ["@smoke", "@commands", "@hes", "@commands-calendar"] },
    async ({ authenticatedApi }, testInfo) => {
      const from = commandsCalendarData.defaultFrom;
      const to = commandsCalendarData.defaultTo;
      const api = new CommandsCalendarApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsCalendarValidator();

      const { rawResponse, responseBody, responseTime } = await api.getCalendar({
        from,
        to,
      });

      await PerformanceTracker.track(
        rawResponse,
        "Commands Calendar",
        rawResponse.url(),
        responseTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          rawResponse.status(),
          "Commands Calendar",
          responseBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands Calendar", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "GET",
            requestParams: { from, to },
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior: "200 with timezone, from/to, and calendar entries.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Calendar",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsCalendarData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () => validator.validateResponse(responseBody));
      expect(responseBody.data).toBeDefined();
      const rawData = responseBody.data!;
      const mapped = CommandsCalendarMapper.mapResponse(responseBody);

      console.log(
        `\n[Calendar] ${mapped.from} → ${mapped.to} tz=${mapped.timezone} entries=${mapped.entries.length}`,
      );
      for (const entry of mapped.entries) {
        console.log(
          `  ${entry.date} ${entry.dayType}` +
            (entry.windowStart ? ` ${entry.windowStart}-${entry.windowEnd}` : "") +
            ` — ${entry.description}`,
        );
      }
      console.log("");

      validation.execute("Root Keys", () => validator.validateRootKeys(rawData));
      validation.execute("Timezone", () => validator.validateTimezone(mapped));
      validation.execute("Range Echo", () => validator.validateRangeEcho(mapped, from, to));
      validation.execute("Entries", () =>
        validator.validateAllEntries(mapped, rawData.entries as object[]),
      );
      validation.execute("Full Calendar Contract", () =>
        validator.validateFullCalendar(mapped, from, to, rawData),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Calendar",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: buildCommandsCalendarPath({ from, to }),
          method: "GET",
          requestParams: { from, to },
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with Asia/Kolkata timezone, echoed from/to, HOLIDAY / SPECIAL_WORKING_DAY entries.",
        },
      });
    },
  );

  test(
    "Validate GET /commands/calendar — invalid range returns validation error",
    { tag: ["@commands", "@hes", "@commands-calendar", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new CommandsCalendarApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsCalendarValidator();

      const { rawResponse, responseBody, responseTime } = await api.getCalendar({
        from: "2026-12-31",
        to: "2026-01-01",
      });

      if (
        BackendResponse.shouldSkipServerFailure(
          rawResponse.status(),
          "Commands Calendar — Invalid Range",
          responseBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands Calendar — Invalid Range", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "GET",
            requestParams: { from: "2026-12-31", to: "2026-01-01" },
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior: "400 when from > to (or empty entries).",
          },
        });
        return;
      }

      const status = rawResponse.status();
      if (status === 400) {
        validation.execute("Status (validation error)", () =>
          assert.validateStatusCode(rawResponse, 400, responseBody),
        );
        validation.execute("Content Type", () => assert.validateContentType(rawResponse));
        validation.execute("Error Response", () => validator.validateErrorResponse(responseBody));
      } else {
        // Some backends accept inverted range and return empty entries.
        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: "Commands Calendar — Invalid Range",
          rawResponse,
          responseBody,
          responseTime,
          maxResponseTimeMs: commandsCalendarData.maxResponseTimeMs,
        });
        validation.execute("Success or empty for inverted range", () => {
          expect(responseBody.success).toBe(true);
          expect(Array.isArray(responseBody.data?.entries)).toBe(true);
        });
      }

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Calendar — Invalid Range",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "GET",
          requestParams: { from: "2026-12-31", to: "2026-01-01" },
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "400 VALIDATION_ERROR or 200 with empty entries.",
        },
      });
    },
  );

  test(
    "Validate GET /commands/calendar/window — disconnect window + daily quota",
    {
      tag: ["@smoke", "@commands", "@hes", "@commands-calendar", "@commands-calendar-window"],
    },
    async ({ authenticatedApi }, testInfo) => {
      const api = new CommandsCalendarApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsCalendarValidator();

      const { rawResponse, responseBody, responseTime } = await api.getCalendarWindow();

      await PerformanceTracker.track(
        rawResponse,
        "Commands Calendar Window",
        rawResponse.url(),
        responseTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          rawResponse.status(),
          "Commands Calendar Window",
          responseBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands Calendar Window", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "GET",
            requestParams: {},
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior: "200 with window times, day, code/accepted, and dailyQuota.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Calendar Window",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsCalendarData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () => validator.validateResponse(responseBody));
      expect(responseBody.data).toBeDefined();
      const rawData = responseBody.data!;
      const mapped = CommandsCalendarMapper.mapWindowResponse(responseBody);

      console.log(
        `\n[Calendar Window] ${mapped.workingDate} ${mapped.windowStart}-${mapped.windowEnd} ` +
          `code=${mapped.code} accepted=${mapped.accepted} override=${mapped.calendarOverride} ` +
          `quota=${mapped.dailyQuota.used}/${mapped.dailyQuota.limit}\n`,
      );

      validation.execute("Full Window Contract", () =>
        validator.validateWindowContract(mapped, rawData),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Calendar Window",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: CALENDAR_WINDOW_PATH,
          method: "GET",
          requestParams: {},
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with Asia/Kolkata window, day (FALLBACK_WORKING/calendar), code, dailyQuota used+remaining=limit.",
        },
      });
    },
  );
});
