import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { CommandsHistoryFiltersApi } from "../Api/commands-history-filters.api";
import {
  COMMANDS_HISTORY_FILTERS_PATH,
  commandsHistoryFiltersData,
} from "../Data/commands-history-filters.data";
import { CommandsHistoryFiltersMapper } from "../Mapper/commands-history-filters.mapper";
import { CommandsHistoryFiltersValidator } from "../Validator/commands-history-filters.validator";

test.describe("HES Commands — History Filters", () => {
  test.setTimeout(120_000);

  test(
    "Validate GET /commands/history/filters — filter dropdown contract",
    { tag: ["@smoke", "@commands", "@hes", "@commands-history-filters"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new CommandsHistoryFiltersApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsHistoryFiltersValidator();

      const { rawResponse, responseBody, responseTime } = await api.getFilters();

      await PerformanceTracker.track(
        rawResponse,
        "Commands History Filters",
        rawResponse.url(),
        responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands History Filters",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsHistoryFiltersData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () => validator.validateResponse(responseBody));
      expect(responseBody.data).toBeDefined();
      const rawData = responseBody.data!;
      const mapped = CommandsHistoryFiltersMapper.mapResponse(responseBody);

      validation.execute("Root Keys", () => validator.validateRootKeys(rawData));
      validation.execute("Command Types", () =>
        validator.validateCommandTypes(mapped.commandTypes),
      );
      validation.execute("Command Type Options", () =>
        validator.validateCommandTypeOptions(mapped.commandTypeOptions, mapped.commandTypes),
      );
      validation.execute("Command Type Display Names", () =>
        validator.validateCommandTypeDisplayNames(
          mapped.commandTypeDisplayNames,
          mapped.commandTypeOptions,
        ),
      );
      validation.execute("Statuses", () => validator.validateStatuses(mapped.statuses));
      validation.execute("Selection Types", () =>
        validator.validateSelectionTypes(mapped.selectionTypes),
      );
      validation.execute("Full Filters Contract", () =>
        validator.validateFullFilters(mapped, rawData),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands History Filters",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: `${process.env.BASE_URL}${COMMANDS_HISTORY_FILTERS_PATH}`,
          method: "GET",
          requestParams: {},
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with commandTypes, options, display names, statuses, selectionTypes.",
        },
      });
    },
  );
});
