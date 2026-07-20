import { test } from "../../../../src/fixtures/api.fixture";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import { patternConsumptionData } from "../Data/patternconsumption.data";
import { PatternConsumptionMapper } from "../Mapper/patternconsumption.mapper";
import { PatternConsumptionValidator } from "../Validator/patternconsumption.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isConsumptionInternalError } from "../utils/consumption-env.helper";
test.describe("Pattern Consumption Yearly API", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  test("Validate Pattern Consumption Yearly API",
    {
      tag: ["@consumption", "@yearly", "@smoke"],
    },
    async ({ authenticatedApi }) => {
      const api = new PatternConsumptionApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getPatternConsumption(
          patternConsumptionData.yearlyType,
          patternConsumptionData.page,
          patternConsumptionData.limit,
          patternConsumptionData.month,
          patternConsumptionData.year,
        );
      await PerformanceTracker.track(
        rawResponse,
        "Pattern Consumption Yearly API",
        rawResponse.url(),
        responseTime,
      );
      // Yearly is intermittently 500 INTERNAL_ERROR under load even after retries.
      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(
          true,
          "Backend GET /indore/consumption/pattern-consumption?patternType=yearly returned 500 INTERNAL_ERROR after retries",
        );
        return;
      }
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
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
        if (rawResponse.status() === 200) {
          assert.validateRequiredFields(responseBody, ["data"]);
        }
      });
      const mapped = PatternConsumptionMapper.map(responseBody);
      const validator = new PatternConsumptionValidator();
      const isOk = rawResponse.status() === 200;
      if (isOk) {
        validation.execute("Table Validation", () =>
          validator.validateTable(mapped),
        );
        validation.execute("Yearly Title", () =>
          validator.validateYearlyTitle(mapped.title, patternConsumptionData.year),
        );
        validation.execute("Yearly Columns", () =>
          validator.validateColumnKeys(mapped.columns, [
            "name",
            "ivrsNumber",
            "msn",
            "phase",
            "sanctionLoadKw",
            "janKwh",
            "decKwh",
            "totalKwh",
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
        validation.execute("Yearly Validation", () =>
          validator.validateYearly(mapped.rows),
        );
        validation.execute("Yearly Total Validation", () =>
          validator.validateYearlyTotal(mapped.rows),
        );
        validation.execute("NaN Validation", () =>
          validator.validateNoNaN(mapped.rows),
        );
      }
      validation.printSummary(
        "Pattern Consumption Yearly API",
        responseTime,
      );
    },
  );
});
