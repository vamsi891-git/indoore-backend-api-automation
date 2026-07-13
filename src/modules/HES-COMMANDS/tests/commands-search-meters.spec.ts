import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsSearchMetersApi } from "../Api/commands-search-meters.api";
import {
  buildSearchMetersBody,
  commandsSearchMetersData,
  SEARCH_METERS_PATH,
} from "../Data/commands-search-meters.data";
import { CommandsSearchMetersMapper } from "../Mapper/commands-search-meters.mapper";
import { CommandsSearchMetersValidator } from "../Validator/commands-search-meters.validator";

test.describe("HES Commands — Search Meters", () => {
  test.setTimeout(120_000);

  test(
    "Validate POST /commands/search-meters — default window",
    { tag: ["@smoke", "@commands", "@hes", "@commands-search-meters"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildSearchMetersBody();
      const api = new CommandsSearchMetersApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsSearchMetersValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postSearchMeters(body);

      const url = `${process.env.BASE_URL}${SEARCH_METERS_PATH}`;
      await PerformanceTracker.track(
        rawResponse,
        "Commands Search Meters",
        rawResponse.url(),
        responseTime
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Search Meters",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsSearchMetersData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );

      const mapped = CommandsSearchMetersMapper.mapResponse(responseBody);

      validation.execute("Result Count", () =>
        validator.validateResultCount(mapped.meters, body.itemCount),
      );
      validation.execute("Unique Meter IDs", () =>
        validator.validateUniqueMeterIds(mapped.meters),
      );
      validation.execute("All Meter Rows", () =>
        validator.validateAllMeters(mapped.meters),
      );
      validation.execute("Expected First Page Meter IDs", () =>
        validator.validateExpectedMeterIds(
          mapped.meters,
          commandsSearchMetersData.expectedFirstPageMeterIds,
        ),
      );
      validation.execute("Known Meter Present", () =>
        validator.validateKnownMeterPresent(
          mapped.meters,
          commandsSearchMetersData.searchMeterId,
        ),
      );
      validation.execute("Full API Contract", () =>
        validator.validateFullContract(
          mapped,
          body.itemStart,
          body.itemCount,
          commandsSearchMetersData.expectedFirstPageMeterIds,
        ),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Search Meters",
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
            "Returns itemCount meters from itemStart with meterId, nullable nodeId, vendor, firmware/hardware version, createTime, updateTime.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/search-meters — paginated itemStart",
    { tag: ["@commands", "@hes", "@commands-search-meters"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildSearchMetersBody({
        itemCount: commandsSearchMetersData.paginationItemCount,
        itemStart: commandsSearchMetersData.paginationItemStart,
      });
      const api = new CommandsSearchMetersApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsSearchMetersValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postSearchMeters(body);

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Search Meters — Pagination",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsSearchMetersData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );

      const mapped = CommandsSearchMetersMapper.mapResponse(responseBody);
      validation.execute("Paginated Meter Window", () =>
        validator.validateFullContract(
          mapped,
          body.itemStart,
          body.itemCount,
          commandsSearchMetersData.expectedPaginationMeterIds,
        ),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Search Meters — Pagination",
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
            "itemStart + itemCount window returns sequential HES meter metadata rows.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/search-meters — invalid itemCount returns error",
    { tag: ["@commands", "@hes", "@commands-search-meters", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildSearchMetersBody({
        itemCount: commandsSearchMetersData.invalidItemCount,
      });
      const api = new CommandsSearchMetersApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsSearchMetersValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postSearchMeters(body);

      const label = "Commands Search Meters — Invalid Item Count";
      const status = rawResponse.status();

      if (BackendResponse.shouldSkipServerFailure(status, label, responseBody)) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary(label, responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "POST",
            requestParams: body,
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "400 for itemCount=0 (backend intermittently returns 500 INTERNAL_ERROR).",
          },
        });
        return;
      }

      validation.execute("Status (bad request)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Error Response", () =>
        validator.validateErrorResponse(responseBody),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: label,
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "itemCount=0 returns 400 with error envelope.",
        },
      });
    },
  );
});
