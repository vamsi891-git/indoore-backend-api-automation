import { test } from "../../../fixtures/api.fixture";
import { expect } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { CommandsHistoryApi } from "../Api/commands-history.api";
import { buildCommandsHistoryPath, commandsHistoryData,} from "../Data/commands-history.data";
import { CommandsHistoryMapper } from "../Mapper/commands-history.mapper";
import { CommandsHistoryValidator } from "../Validator/commands-history.validator";
function runHistoryStandardChecks(validation: ValidationEngine,assert: AssertionEngine,apiName: string,rawResponse: Awaited<
  ReturnType<CommandsHistoryApi["getHistory"]>
  >["rawResponse"],
  responseBody: Awaited<
    ReturnType<CommandsHistoryApi["getHistory"]>
  >["responseBody"],
  responseTime: number,
): void {
  ApiValidationHelper.runStandardChecks(validation, assert, {
    apiName,
    rawResponse,
    responseBody,
    responseTime,
    maxResponseTimeMs: commandsHistoryData.maxResponseTimeMs,
  });
  validation.execute("Success Response", () =>
    new CommandsHistoryValidator().validateResponse(responseBody),
  );
}
test.describe("HES Commands — History", () => {
  test.setTimeout(120_000);
  test("Validate GET /commands/history — page 1 default pagination",
    { tag: ["@smoke", "@commands", "@hes", "@commands-history"] },
    async ({ authenticatedApi }, testInfo) => {
      const query = {
        page: commandsHistoryData.defaultPage,
        limit: commandsHistoryData.defaultLimit,
      };
      const api = new CommandsHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsHistoryValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getHistory(query);
      const url = `${process.env.BASE_URL}${buildCommandsHistoryPath(query)}`;
      await PerformanceTracker.track(
        rawResponse,
        "Commands History — Page 1",
        url,
        responseTime,
      );

      runHistoryStandardChecks(
        validation,
        assert,
        "Commands History — Page 1",
        rawResponse,
        responseBody,
        responseTime,
      );
      const data = CommandsHistoryMapper.mapResponse(responseBody);
      validation.execute("Requested Time DESC", () =>
        validator.validateRequestedTimeDescending(data.rows),
      );
      validation.execute("Unique Row Keys (requestId + meter)", () =>
        validator.validateUniqueRowKeys(data.rows),
      );
      validation.execute("Bulk Job Row Consistency", () =>
        validator.validateBulkJobRowConsistency(data.rows),
      );
      validation.execute("Pagination Field Types", () =>
        validator.validatePaginationFieldTypes(data),
      );
      validation.execute("Total Records", () =>
        validator.validateTotalRecords(data, query.limit),
      );
      validation.execute("Full API Contract", () =>
        validator.validateFullHistory(data, query.page, query.limit),
      );
      ApiValidationHelper.finalize(validation, {
        apiName: "Commands History — Page 1",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/history",
          method: "GET",
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "skip/take pagination; ORDER BY requested_time DESC; bulk jobs may share requestId across meters.",
        },
      });
    },
  );
  test(
    "Validate GET /commands/history — page 2 hasPreviousPage",
    { tag: ["@commands", "@hes", "@commands-history"] },
    async ({ authenticatedApi }, testInfo) => {
      const query = { page: 2, limit: commandsHistoryData.defaultLimit };
      const api = new CommandsHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsHistoryValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getHistory(query);
      runHistoryStandardChecks(
        validation,
        assert,
        "Commands History — Page 2",
        rawResponse,
        responseBody,
        responseTime,
      );
      const data = CommandsHistoryMapper.mapResponse(responseBody);
      validation.execute("Page 2 Pagination", () => {
        validator.validatePagination(data, query.page, query.limit);
        expect(data.pagination.hasPreviousPage).toBe(true);
      });
      validation.execute("Global SNO Sequence", () =>
        validator.validateSnoSequence(data.rows, query.page, query.limit),
      );
      validation.execute("Requested Time DESC", () =>
        validator.validateRequestedTimeDescending(data.rows),
      );
      ApiValidationHelper.finalize(validation, {
        apiName: "Commands History — Page 2",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/history",
          method: "GET",
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Page 2: hasPreviousPage true; global sno continues (11..20).",
        },
      });
    },
  );
  test("Validate GET /commands/history — last page row count",
    { tag: ["@commands", "@hes", "@commands-history"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new CommandsHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsHistoryValidator();
      const page1 = await api.getHistory({
        page: 1,
        limit: commandsHistoryData.defaultLimit,
      });
      const page1Data = CommandsHistoryMapper.mapResponse(page1.responseBody);
      const lastPage = page1Data.pagination.totalPages;

      const query = { page: lastPage, limit: commandsHistoryData.defaultLimit };
      const { rawResponse, responseBody, responseTime } =
        await api.getHistory(query);
      runHistoryStandardChecks(
        validation,
        assert,
        "Commands History — Last Page",
        rawResponse,
        responseBody,
        responseTime,
      );
      const data = CommandsHistoryMapper.mapResponse(responseBody);
      validation.execute("Last Page Pagination", () => {
        validator.validatePagination(data, lastPage, query.limit);
        expect(data.pagination.hasNextPage).toBe(false);
      });
      ApiValidationHelper.finalize(validation, {
        apiName: "Commands History — Last Page",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/history",
          method: "GET",
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "Last page row count = totalRecords - (totalPages-1)*limit; hasNextPage false.",
        },
      });
    },
  );
  test(
    "Validate GET /commands/history — search filter by meter serial",
    { tag: ["@commands", "@hes", "@commands-history"] },
    async ({ authenticatedApi }, testInfo) => {
      const search = commandsHistoryData.searchMeterSerial;
      const query = {
        page: 1,
        limit: commandsHistoryData.defaultLimit,
        search,
      };
      const api = new CommandsHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsHistoryValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getHistory(query);
      runHistoryStandardChecks(validation,assert,"Commands History — Search",rawResponse,responseBody,responseTime,);
      const data = CommandsHistoryMapper.mapResponse(responseBody);
      validation.execute("Rows Exist", () => validator.validateRowsExist(data));
      validation.execute("Search Filter", () =>
        validator.validateSearchFilter(data.rows, search),
      );
      ApiValidationHelper.finalize(validation, {
        apiName: "Commands History — Search",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/history",
          method: "GET",
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "search OR filter on request_id, command_name, selected, status, user fields.",
        },
      });
    },
  );
  test(
    "Validate GET /commands/history — commandType filter",
    { tag: ["@commands", "@hes", "@commands-history"] },
    async ({ authenticatedApi }, testInfo) => {
      const commandType = commandsHistoryData.searchCommandType;
      const query = {
        page: 1,
        limit: commandsHistoryData.defaultLimit,
        commandType,
      };
      const api = new CommandsHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsHistoryValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.getHistory(query);

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands History — Command Type",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsHistoryData.maxResponseTimeMs,
      });
      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );
      const data = CommandsHistoryMapper.mapResponse(responseBody);
      validation.execute("Rows Exist", () => validator.validateRowsExist(data));
      validation.execute("Command Type Filter", () =>
        validator.validateCommandTypeFilter(data.rows, commandType),
      );
      ApiValidationHelper.finalize(validation, {
        apiName: "Commands History — Command Type",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/history",
          method: "GET",
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "commandType ILIKE filter on command_name when not 'All Commands'.",
        },
      });
    },
  );
});
