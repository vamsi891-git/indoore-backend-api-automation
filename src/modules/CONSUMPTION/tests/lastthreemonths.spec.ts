import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import {
  patternConsumptionData,
  patternLastThreeColumnKeys,
} from "../Data/patternconsumption.data";
import { PatternConsumptionMapper } from "../Mapper/patternconsumption.mapper";
import { PatternConsumptionValidator } from "../Validator/patternconsumption.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { PatternLastThreeResponseSchema } from "../schemas/consumption.schemas";
import { skipIfConsumptionInternalError } from "../utils/consumption-env.helper";

test.describe("Pattern last three months list", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  test(
    "Last three months — first page lists each consumer (month energy may be empty)",
    {
      tag: ["@consumption", "@last-three-months", "@smoke", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new PatternConsumptionApi(authenticatedApi);
      const { page, limit, month, year, maxResponseTime, lastThreeMonthsType } =
        patternConsumptionData;
      const title =
        "Last three months — first page lists each consumer (month energy may be empty)";
      const { rawResponse, responseBody, responseTime } =
        await api.getPatternConsumption(
          lastThreeMonthsType,
          page,
          limit,
          month,
          year,
        );
      await PerformanceTracker.track(
        rawResponse,
        title,
        rawResponse.url(),
        responseTime,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/pattern-consumption?patternType=lastThree",
      );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const mapped = PatternConsumptionMapper.map(responseBody);
      const validator = new PatternConsumptionValidator();
      const isOk = rawResponse.status() === 200;
      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, maxResponseTime),
      );
      validation.execute("Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success"]),
      );
      if (isOk) {
        validation.execute("Data Present When 200", () =>
          assert.validateRequiredFields(responseBody, ["data"]),
        );
        validation.execute("Zod Response Schema", () => {
          const result = PatternLastThreeResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
        validation.execute("Success", () =>
          validator.validateSuccess(mapped.success),
        );
        validation.execute("Table Validation", () =>
          validator.validateTable(mapped),
        );
        validation.execute("Last Three Title", () =>
          validator.validateLastThreeTitle(mapped.title, month, year),
        );
        validation.execute("Last Three Columns", () =>
          validator.validateColumnKeys(mapped.columns, [
            ...patternLastThreeColumnKeys,
          ]),
        );
        validation.execute("Pagination Validation", () =>
          validator.validatePagination(
            mapped.pagination,
            page,
            limit,
            mapped.rows.length,
          ),
        );
        validation.execute("Rows Within Limit", () =>
          validator.validateRowsWithinLimit(mapped.rows, limit),
        );
      }
      if (isOk && mapped.rows.length > 0) {
        validation.execute("SLNO Validation", () =>
          validator.validateSlNo(
            mapped.rows,
            mapped.pagination.page,
            mapped.pagination.pageSize,
          ),
        );
        validation.execute("Required Fields", () =>
          validator.validateRequiredFields(mapped.rows),
        );
        validation.execute("Unique consumers", () =>
          validator.validateUniqueConsumers(mapped.rows),
        );
        validation.execute("Shared feeder allowed", () =>
          validator.validateSharedHierarchyAllowed(mapped.rows),
        );
        validation.execute("Phase Validation", () =>
          validator.validatePhase(mapped.rows),
        );
        validation.execute("Sanction Load Validation", () =>
          validator.validateSanctionLoad(mapped.rows),
        );
        validation.execute("Last Three Months Validation", () =>
          validator.validateLastThreeMonths(mapped.rows),
        );
        validation.execute("NaN Validation", () =>
          validator.validateNoNaN(mapped.rows),
        );
      }
      validation.printSummary(title, responseTime);
    },
  );
});
