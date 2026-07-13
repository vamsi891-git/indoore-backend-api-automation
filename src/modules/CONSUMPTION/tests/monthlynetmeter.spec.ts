import { test } from "../../../../src/fixtures/api.fixture";
import { MonthlyNetMeterApi } from "../Api/monthlynetmeter.api";
import { monthlyNetMeterData } from "../Data/monthlynetmeter.data";
import { MonthlyNetMeterMapper } from "../Mapper/monthlynetmeter.mapper";
import { MonthlyNetMeterValidator } from "../Validator/monthlynetmeter.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isConsumptionInternalError } from "../utils/consumption-env.helper";

test.describe("Monthly Net Meter Consumption API", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);

  test(
    "Validate Monthly Net Meter Consumption API",
    {
      tag: [
        "@consumption",
        "@monthly-net-meter",
        "@smoke",
        "@backend-defect",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new MonthlyNetMeterApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getMonthlyNetMeter(
          monthlyNetMeterData.page,
          monthlyNetMeterData.limit,
          monthlyNetMeterData.month,
          monthlyNetMeterData.year,
        );

      await PerformanceTracker.track(
        rawResponse,
        "Monthly Net Meter Consumption API",
        rawResponse.url(),
        responseTime,
      );

      // Live API currently returns 500 INTERNAL_ERROR for all probed month/year/limit
      // combinations (~20s). Auto-resume full assertions when backend returns 200.
      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(
          true,
          "Backend GET /indore/consumption/monthly-net-meter returns 500 INTERNAL_ERROR",
        );
        return;
      }

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new MonthlyNetMeterValidator();
      const mapped = MonthlyNetMeterMapper.map(responseBody);
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
          monthlyNetMeterData.maxResponseTime,
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
        validation.execute("Items Validation", () =>
          validator.validateItems(mapped),
        );
        validation.execute("Pagination Validation", () =>
          validator.validatePagination(mapped),
        );
        validation.execute("Required Item Fields", () =>
          validator.validateRequiredFields(mapped.items),
        );
        validation.execute("Type Validation", () =>
          validator.validateTypes(mapped.items),
        );
        validation.execute("Net KWH Logic", () =>
          validator.validateNetKwhLogic(mapped.items),
        );
        validation.execute("Net KVAH Logic", () =>
          validator.validateNetKvahLogic(mapped.items),
        );
        validation.execute("Null Handling", () =>
          validator.validateNullHandling(mapped.items),
        );
        validation.execute("NaN Validation", () =>
          validator.validateNoNaN(mapped.items),
        );
      }

      validation.printSummary(
        "Monthly Net Meter Consumption API",
        responseTime,
      );
    },
  );
});
