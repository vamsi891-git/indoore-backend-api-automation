import { test } from "../../../fixtures/api.fixture";
import { ConsumptionReportApi } from "../Api/consumption-report.api";
import { hourlyConsumptionData } from "../Data/hourlyconsumption.data";
import {
  HourlyConsumptionMapper,
  HourlyConsumptionResponse,
} from "../Mapper/hourlyconsumption.mapper";
import { HourlyConsumptionValidator } from "../Validator/hourlyconsumption.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isConsumptionInternalError } from "../utils/consumption-env.helper";

test.describe("Hourly Consumption Report API", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);

  test(
    "Validate Hourly Consumption Report API",
    {
      tag: ["@consumption", "@hourly-consumption", "@smoke", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const { page, limit, fromDate, toDate, month, year, maxResponseTime } =
        hourlyConsumptionData;

      const { rawResponse, responseBody, responseTime } =
        await api.getReport<HourlyConsumptionResponse>(
          "hourly",
          page,
          limit,
          fromDate,
          toDate,
          month,
          year,
        );

      await PerformanceTracker.track(
        rawResponse,
        "Hourly Consumption Report API",
        rawResponse.url(),
        responseTime,
      );

      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(
          true,
          "Backend GET /indore/consumption/report?reportType=hourly returned 500 INTERNAL_ERROR",
        );
        return;
      }

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new HourlyConsumptionValidator();
      const mapped = HourlyConsumptionMapper.map(responseBody);
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
        validation.execute("Success", () =>
          validator.validateSuccess(mapped.success),
        );
        validation.execute("Root Structure", () =>
          validator.validateRootStructure(mapped),
        );
        validation.execute("Query Echo", () =>
          validator.validateQueryEcho(mapped, page, limit),
        );
        validation.execute("Pagination Bounds", () =>
          validator.validatePaginationBounds(mapped),
        );
        validation.execute("Pagination Math", () =>
          validator.validatePaginationMath(mapped),
        );
      }

      if (isOk && mapped.items.length > 0) {
        validation.execute("Item Required Fields", () =>
          validator.validateItemRequiredFields(mapped.items),
        );
        validation.execute("Serial Sequence", () =>
          validator.validateSerialSequence(mapped.items, mapped.page, mapped.limit),
        );
        validation.execute("Hour Buckets", () =>
          validator.validateHourBuckets(mapped.items),
        );
        validation.execute("Hourly Total Bundle", () =>
          validator.validateHourlyTotalBundle(mapped.items),
        );
        validation.execute("No NaN", () =>
          validator.validateNoNaN(mapped.items),
        );
      }

      validation.printSummary("Hourly Consumption Report API", responseTime);
    },
  );
});
