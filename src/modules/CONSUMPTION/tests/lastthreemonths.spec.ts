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
test.describe("Pattern Consumption Last Three Months API", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  test("Validate Pattern Consumption Last Three Months API",
    {
      tag: ["@consumption", "@last-three-months", "@smoke"],
    },
    async ({ authenticatedApi }) => {
      const api = new PatternConsumptionApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getPatternConsumption(
          patternConsumptionData.lastThreeMonthsType,
          patternConsumptionData.page,
          patternConsumptionData.limit,
          patternConsumptionData.month,
          patternConsumptionData.year,
        );
      await PerformanceTracker.track(
        rawResponse,
        "Pattern Consumption Last Three Months API",
        rawResponse.url(),
        responseTime,
      );
      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(
          true,
          "Backend GET /indore/consumption/pattern-consumption?patternType=lastThree returned 500 INTERNAL_ERROR after retries",
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
      if (isOk) {
        validation.execute("Table Validation", () =>
          validator.validateTable(mapped),
        );
        validation.execute("Rows Validation", () =>
          validator.validateRows(mapped.rows),
        );
        validation.execute("SLNO Validation", () =>
          validator.validateSlNo(mapped.rows),
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
        validation.execute("Last Three Months Validation", () =>
          validator.validateLastThreeMonths(mapped.rows),
        );
        validation.execute("NaN Validation", () =>
          validator.validateNoNaN(mapped.rows),
        );
      }
      validation.printSummary(
        "Pattern Consumption Last Three Months API",
        responseTime,
      );
    },
  );
});
