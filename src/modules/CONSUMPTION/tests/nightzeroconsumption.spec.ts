import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ConsumptionReportApi } from "../Api/consumption-report.api";
import { nightZeroConsumptionData } from "../Data/nightzeroconsumption.data";
import {
  NightZeroConsumptionMapper,
  NightZeroConsumptionResponse,
} from "../Mapper/nightzeroconsumption.mapper";
import { NightZeroConsumptionValidator } from "../Validator/nightzeroconsumption.validator";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { NightZeroConsumptionResponseSchema } from "../schemas/consumption.schemas";
import { skipIfConsumptionInternalError } from "../utils/consumption-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Night-time consumption list", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  test(
    "Night-time consumption — first page lists each consumer (night/day use may be empty)",
    {
      tag: ["@consumption", "@night-zero-consumption", "@smoke", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const { page, limit, fromDate, toDate, month, year, maxResponseTime } =
        nightZeroConsumptionData;
      const { rawResponse, responseBody, responseTime } =
        await api.getReport<NightZeroConsumptionResponse>(
          "nightZero",
          page,
          limit,
          fromDate,
          toDate,
          month,
          year,
        );
      await PerformanceTracker.track(
        rawResponse,
        "Night-time consumption — first page lists each consumer (night/day use may be empty)",
        rawResponse.url(),
        responseTime,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=nightZero",
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new NightZeroConsumptionValidator();
      const mapped = NightZeroConsumptionMapper.map(responseBody);
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
        validation.execute("Zod Response Schema", () => {
          const result = NightZeroConsumptionResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
        validation.execute("Data Present When 200", () =>
          assert.validateRequiredFields(responseBody, ["data"]),
        );
        validation.execute("Success", () => validator.validateSuccess(mapped.success));
        validation.execute("Root Structure", () => validator.validateRootStructure(mapped));
        validation.execute("Query Echo", () => validator.validateQueryEcho(mapped, page, limit));
        validation.execute("Pagination Bounds", () => validator.validatePaginationBounds(mapped));
        validation.execute("Pagination Math", () => validator.validatePaginationMath(mapped));
        validation.execute("Items Present When Total Positive", () =>
          validator.validateItemsPresentWhenTotalPositive(mapped),
        );
        validation.execute("Business Rules", () => validator.validateBusinessRules(mapped));
      }
      if (isOk && mapped.items.length > 0) {
        validation.execute("Item Required Fields", () =>
          validator.validateItemRequiredFields(mapped.items),
        );
        validation.execute("Item Structure", () => validator.validateItemStructure(mapped.items));
        validation.execute("Serial Sequence", () =>
          validator.validateSerialSequence(mapped.items, mapped.page, mapped.limit),
        );
        validation.execute("Unique consumers", () =>
          validator.validateUniqueSerialNumbers(mapped.items),
        );
        validation.execute("Shared feeder allowed", () =>
          validator.validateSharedHierarchyAllowed(mapped.items),
        );
        validation.execute("Day Equals Total When Present", () =>
          validator.validateDayEqualsTotalWhenPresent(mapped.items),
        );
        validation.execute("Non-Negative Metrics", () =>
          validator.validateNonNegativeMetrics(mapped.items),
        );
        validation.execute("Round5 Precision", () =>
          validator.validateRound5Precision(mapped.items),
        );
        validation.execute("No NaN", () => validator.validateNoNaN(mapped.items));
      }
      validation.printSummary(
        "Night-time consumption — first page lists each consumer (night/day use may be empty)",
        responseTime,
      );
    },
  );
});
