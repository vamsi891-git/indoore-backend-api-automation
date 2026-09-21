import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import {
  patternComparisonColumnKeys,
  patternConsumptionData,
} from "../Data/patternconsumption.data";
import { PatternConsumptionMapper } from "../Mapper/patternconsumption.mapper";
import { PatternConsumptionValidator } from "../Validator/patternconsumption.validator";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { PatternComparisonResponseSchema } from "../schemas/consumption.schemas";
import { skipIfConsumptionInternalError } from "../utils/consumption-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Pattern comparison list", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  test(
    "Pattern comparison — first page lists each consumer (month kWh may be empty)",
    {
      tag: ["@consumption", "@comparison", "@smoke", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new PatternConsumptionApi(authenticatedApi);
      const { page, limit, month, year, maxResponseTime, comparisonType } = patternConsumptionData;
      const title = "Pattern comparison — first page lists each consumer (month kWh may be empty)";
      const { rawResponse, responseBody, responseTime } = await api.getPatternConsumption(
        comparisonType,
        page,
        limit,
        month,
        year,
      );
      await PerformanceTracker.track(rawResponse, title, rawResponse.url(), responseTime);
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/pattern-consumption?patternType=comparison",
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const mapped = PatternConsumptionMapper.map(responseBody);
      const validator = new PatternConsumptionValidator();
      const isOk = rawResponse.status() === 200;
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200, responseBody));
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, maxResponseTime),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success"]),
      );
      if (isOk) {
        validation.execute("Data Present When 200", () =>
          assert.validateRequiredFields(responseBody, ["data"]),
        );
        validation.execute("Zod Response Schema", () => {
          const result = PatternComparisonResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
        validation.execute("Success", () => validator.validateSuccess(mapped.success));
        validation.execute("Table Validation", () => validator.validateTable(mapped));
        validation.execute("Comparison Title", () =>
          validator.validateComparisonTitle(mapped.title, month, year),
        );
        validation.execute("Comparison Columns", () =>
          validator.validateColumnKeys(mapped.columns, [...patternComparisonColumnKeys]),
        );
        validation.execute("Pagination Validation", () =>
          validator.validatePagination(mapped.pagination, page, limit, mapped.rows.length),
        );
        validation.execute("Rows Within Limit", () =>
          validator.validateRowsWithinLimit(mapped.rows, limit),
        );
      }
      if (isOk && mapped.rows.length > 0) {
        validation.execute("SLNO Validation", () =>
          validator.validateSlNo(mapped.rows, mapped.pagination.page, mapped.pagination.pageSize),
        );
        validation.execute("Required Item Fields", () =>
          validator.validateRequiredFields(mapped.rows),
        );
        validation.execute("Unique consumers", () =>
          validator.validateUniqueConsumers(mapped.rows),
        );
        validation.execute("Shared feeder allowed", () =>
          validator.validateSharedHierarchyAllowed(mapped.rows),
        );
        validation.execute("Phase Validation", () => validator.validatePhase(mapped.rows));
        validation.execute("Sanction Load Validation", () =>
          validator.validateSanctionLoad(mapped.rows),
        );
        validation.execute("Comparison Validation", () =>
          validator.validateComparison(mapped.rows),
        );
        validation.execute("NaN Validation", () => validator.validateNoNaN(mapped.rows));
      }
      validation.printSummary(title, responseTime);
    },
  );
});
