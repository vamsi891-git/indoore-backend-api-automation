import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { MonthlyNetMeterApi } from "../Api/monthlynetmeter.api";
import { monthlyNetMeterData } from "../Data/monthlynetmeter.data";
import { MonthlyNetMeterMapper } from "../Mapper/monthlynetmeter.mapper";
import { MonthlyNetMeterValidator } from "../Validator/monthlynetmeter.validator";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { MonthlyNetMeterResponseSchema } from "../schemas/consumption.schemas";
import { skipIfConsumptionInternalError } from "../utils/consumption-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Monthly net meter list", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  test(
    "Monthly net meter — first page lists each consumer (import, export, and net may be empty)",
    {
      tag: ["@consumption", "@monthly-net-meter", "@smoke", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new MonthlyNetMeterApi(authenticatedApi);
      const { page, limit, month, year, maxResponseTime } = monthlyNetMeterData;
      const { rawResponse, responseBody, responseTime } = await api.getMonthlyNetMeter(
        page,
        limit,
        month,
        year,
      );
      await PerformanceTracker.track(
        rawResponse,
        "Monthly net meter — first page lists each consumer (import, export, and net may be empty)",
        rawResponse.url(),
        responseTime,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/monthly-net-meter",
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new MonthlyNetMeterValidator();
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200, responseBody));
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, maxResponseTime),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success"]),
      );
      const mapped = MonthlyNetMeterMapper.map(responseBody);
      const isOk = rawResponse.status() === 200;
      if (isOk) {
        validation.execute("Data Present When 200", () =>
          assert.validateRequiredFields(responseBody, ["data"]),
        );
        validation.execute("Zod Response Schema", () => {
          const result = MonthlyNetMeterResponseSchema.safeParse(responseBody);
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
        validation.execute("Items Present When Total Positive", () =>
          validator.validateItemsPresentWhenTotalPositive(mapped),
        );
        validation.execute("Business Rules", () => validator.validateBusinessRules(mapped));
      }
      if (isOk && mapped.items.length > 0) {
        validation.execute("Required Item Fields", () =>
          validator.validateRequiredFields(mapped.items),
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
        validation.execute("Import/Export Non-Negative", () =>
          validator.validateImportExportNonNegative(mapped.items),
        );
        validation.execute("Net KWH Logic", () => validator.validateNetKwhLogic(mapped.items));
        validation.execute("Net KVAH Logic", () => validator.validateNetKvahLogic(mapped.items));
        validation.execute("Null Handling", () => validator.validateNullHandling(mapped.items));
        validation.execute("Round5 Precision", () =>
          validator.validateRound5Precision(mapped.items),
        );
        validation.execute("NaN Validation", () => validator.validateNoNaN(mapped.items));
      }
      validation.printSummary(
        "Monthly net meter — first page lists each consumer (import, export, and net may be empty)",
        responseTime,
      );
    },
  );
});
