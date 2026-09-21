import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ConsumptionReportApi } from "../Api/consumption-report.api";
import { monthlyReportConsumptionData } from "../Data/monthlyconsumption.data";
import {
  MonthlyReportConsumptionMapper,
  MonthlyReportConsumptionResponse,
} from "../Mapper/monthlyconsumption.mapper";
import { MonthlyReportConsumptionValidator } from "../Validator/monthlyconsumption.validator";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { MonthlyConsumptionResponseSchema } from "../schemas/consumption.schemas";
import { skipIfConsumptionInternalError } from "../utils/consumption-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
test.describe("Monthly consumption list", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  test(
    "Monthly consumption — first page lists each consumer (energy may be empty)",
    {
      tag: ["@consumption", "@monthly-consumption", "@smoke", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const { page, limit, fromDate, toDate, month, year, maxResponseTime } =
        monthlyReportConsumptionData;
      const { rawResponse, responseBody, responseTime } =
        await api.getReport<MonthlyReportConsumptionResponse>(
          "monthly",
          page,
          limit,
          fromDate,
          toDate,
          month,
          year,
        );
      await PerformanceTracker.track(
        rawResponse,
        "Monthly consumption — first page lists each consumer (energy may be empty)",
        rawResponse.url(),
        responseTime,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=monthly",
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new MonthlyReportConsumptionValidator();
      const mapped = MonthlyReportConsumptionMapper.map(responseBody);
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
          const result = MonthlyConsumptionResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
        validation.execute("Success", () => validator.validateSuccess(mapped.success));
        validation.execute("Root Structure", () => validator.validateRootStructure(mapped));
        validation.execute("Query Echo", () => validator.validateQueryEcho(mapped, page, limit));
        validation.execute("Pagination Bounds", () => validator.validatePaginationBounds(mapped));
        validation.execute("Pagination Math", () => validator.validatePaginationMath(mapped));
      }
      if (isOk && mapped.items.length > 0) {
        validation.execute("Item Required Fields", () =>
          validator.validateItemRequiredFields(mapped.items),
        );
        validation.execute("Serial Sequence", () =>
          validator.validateSerialSequence(mapped.items, mapped.page, mapped.limit),
        );
        validation.execute("Unique consumers", () =>
          validator.validateUniqueConsumers(mapped.items),
        );
        validation.execute("Shared feeder allowed", () =>
          validator.validateSharedHierarchyAllowed(mapped.items),
        );
        validation.execute("Energy Fields", () => validator.validateEnergyFields(mapped.items));
        validation.execute("Null Energy Bundle", () =>
          validator.validateNullEnergyBundle(mapped.items),
        );
        validation.execute("No NaN", () => validator.validateNoNaN(mapped.items));
      }
      validation.printSummary(
        "Monthly consumption — first page lists each consumer (energy may be empty)",
        responseTime,
      );
    },
  );
});
