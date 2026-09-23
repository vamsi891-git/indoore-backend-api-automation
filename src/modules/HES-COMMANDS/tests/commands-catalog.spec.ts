import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { normalizeApiBaseUrl, resolveApiPath } from "../../../core/utils/api-path.util";
import { CommandsCatalogApi } from "../Api/commands-catalog.api";
import { COMMANDS_CATALOG_PATH, commandsCatalogData } from "../Data/commands-catalog.data";
import { CommandsCatalogMapper } from "../Mapper/commands-catalog.mapper";
import { CommandsCatalogValidator } from "../Validator/commands-catalog.validator";

test.describe("HES Commands — Catalog", () => {
  test.setTimeout(120_000);

  test(
    "Validate GET /commands/catalog — classifications, command types, examples",
    { tag: ["@smoke", "@commands", "@hes", "@commands-catalog"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new CommandsCatalogApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsCatalogValidator();

      const { rawResponse, responseBody, responseTime } = await api.getCatalog();

      await PerformanceTracker.track(
        rawResponse,
        "Commands Catalog",
        rawResponse.url(),
        responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Catalog",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsCatalogData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () => validator.validateResponse(responseBody));
      expect(responseBody.data).toBeDefined();
      const rawData = responseBody.data!;
      const mapped = CommandsCatalogMapper.mapResponse(responseBody);

      validation.execute("Root Keys", () => validator.validateRootKeys(rawData));
      validation.execute("Classifications", () =>
        validator.validateClassifications(mapped.classifications),
      );
      validation.execute("Command Types", () =>
        validator.validateCommandTypes(mapped.commandTypes, mapped.classifications),
      );
      validation.execute("Command Data Examples", () =>
        validator.validateCommandDataExamples(mapped.commandDataExamples, mapped.commandTypes),
      );
      validation.execute("Full Catalog Contract", () =>
        validator.validateFullCatalog(mapped, rawData),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Catalog",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: resolveApiPath(COMMANDS_CATALOG_PATH),
          method: "GET",
          requestParams: {},
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with classifications, commandTypes, and commandDataExamples catalog.",
        },
      });
    },
  );

  test(
    "Validate GET /commands/catalog — without auth returns 401",
    { tag: ["@commands", "@hes", "@commands-catalog", "@negative", "@auth"] },
    async ({ request }, testInfo) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsCatalogValidator();

      const catalogPath = resolveApiPath(COMMANDS_CATALOG_PATH);
      const url = `${normalizeApiBaseUrl(process.env.BASE_URL)}${catalogPath}`;
      const start = Date.now();
      const rawResponse = await request.get(url);
      const responseTime = Date.now() - start;
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error Response", () => validator.validateErrorResponse(responseBody));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Catalog — Unauthorized",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: url,
          method: "GET",
          requestParams: {},
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "Unauthenticated catalog request returns 401.",
        },
      });
    },
  );
});
