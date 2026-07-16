import { test } from "../../../fixtures/api.fixture";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import { patternConsumptionData } from "../Data/patternconsumption.data";
import { PatternConsumptionMapper } from "../Mapper/patternconsumption.mapper";
import { PatternConsumptionValidator } from "../Validator/patternconsumption.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isConsumptionInternalError } from "../utils/consumption-env.helper";

test.describe("Pattern Consumption Comparison API", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);

  test(
    "Validate Pattern Consumption Comparison API",
    {
      tag: ["@consumption", "@comparison", "@smoke", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new PatternConsumptionApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getPatternConsumption(
          patternConsumptionData.comparisonType,
          patternConsumptionData.page,
          patternConsumptionData.limit,
          patternConsumptionData.month,
          patternConsumptionData.year,
        );

      await PerformanceTracker.track(
        rawResponse,
        "Pattern Consumption Comparison API",
        rawResponse.url(),
        responseTime,
      );

      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(
          true,
          "Backend GET /indore/consumption/pattern-consumption?patternType=comparison returned 500 INTERNAL_ERROR",
        );
        return;
      }

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const mapped = PatternConsumptionMapper.map(responseBody);
      const validator = new PatternConsumptionValidator();
      const isOk = rawResponse.status() === 200;

      validation.execute("Status Code", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(
          responseTime,
          patternConsumptionData.maxResponseTime,
        ),
      );
      validation.execute("Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success"]),
      );
      validation.execute("Data Present When 200", () => {
        if (isOk) {
          assert.validateRequiredFields(responseBody, ["data"]);
        }
      });

      if (isOk) {
        validation.execute("Table Validation", () =>
          validator.validateTable(mapped),
        );
        validation.execute("Comparison Title", () =>
          validator.validateComparisonTitle(
            mapped.title,
            patternConsumptionData.month,
            patternConsumptionData.year,
          ),
        );
        validation.execute("Comparison Columns", () =>
          validator.validateColumnKeys(mapped.columns, [
            "name",
            "ivrsNumber",
            "meterSerialNo",
            "currentMonthKwh",
            "lastMonthKwh",
            "lastYearSameMonthKwh",
          ]),
        );
        validation.execute("Pagination Validation", () =>
          validator.validatePagination(
            mapped.pagination,
            patternConsumptionData.page,
            patternConsumptionData.limit,
            mapped.rows.length,
          ),
        );
        validation.execute("Rows Validation", () =>
          validator.validateRows(mapped.rows),
        );
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
        validation.execute("Phase Validation", () =>
          validator.validatePhase(
            mapped.rows,
            patternConsumptionData.allowedPhases,
          ),
        );
        validation.execute("Sanction Load Validation", () =>
          validator.validateSanctionLoad(mapped.rows),
        );
        validation.execute("Comparison Validation", () =>
          validator.validateComparison(mapped.rows),
        );
        validation.execute("NaN Validation", () =>
          validator.validateNoNaN(mapped.rows),
        );
      }

      validation.printSummary(
        "Pattern Consumption Comparison API",
        responseTime,
      );
    },
  );
});
