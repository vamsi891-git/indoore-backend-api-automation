import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { DailyConsumptionApi } from "../Api/dailyconsumption.api";
import { dailyConsumptionData } from "../Data/dailyconsumption.data";
import { DailyConsumptionMapper } from "../Mapper/dailyconsumption.mapper";
import { DailyConsumptionValidator } from "../Validator/dailyconsumption.validator";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DailyConsumptionResponseSchema } from "../schemas/consumption.schemas";
import { skipIfConsumptionInternalError } from "../utils/consumption-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
test.describe("Daily consumption list", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  test(
    "Daily consumption — first page lists each consumer (readings may be empty)",
    {
      tag: ["@consumption", "@daily-consumption", "@smoke"],
    },
    async ({ authenticatedApi }) => {
      const api = new DailyConsumptionApi(authenticatedApi);
      const { page, limit, fromDate, toDate, month, year, maxResponseTime } = dailyConsumptionData;
      const { rawResponse, responseBody, responseTime } = await api.getDailyReport(
        page,
        limit,
        fromDate,
        toDate,
        month,
        year,
      );
      await PerformanceTracker.track(
        rawResponse,
        "Daily consumption — first page lists each consumer (readings may be empty)",
        rawResponse.url(),
        responseTime,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=daily",
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new DailyConsumptionValidator();
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200, responseBody));
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, maxResponseTime),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success"]),
      );
      validation.execute("Data Present When 200", () => {
        if (rawResponse.status() === 200) {
          assert.validateRequiredFields(responseBody, ["data"]);
        }
      });
      const mapped = DailyConsumptionMapper.map(responseBody);
      const { items } = mapped;
      const isOk = rawResponse.status() === 200;
      if (isOk) {
        validation.execute("Zod Response Schema", () => {
          const result = DailyConsumptionResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
        validation.execute("Mapped Required Fields", () =>
          assert.validateRequiredFields(mapped, ["items", "total", "page", "limit", "totalPages"]),
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
      if (isOk && items.length > 0) {
        validation.execute("Item Required Fields", () =>
          validator.validateItemRequiredFields(items),
        );
        validation.execute("Item Structure", () => validator.validateItemStructure(items));
        validation.execute("Serial Sequence", () =>
          validator.validateSerialSequence(items, mapped.page, mapped.limit),
        );
        validation.execute("Unique consumers", () => validator.validateUniqueSerialNumbers(items));
        validation.execute("Shared feeder allowed", () =>
          validator.validateSharedHierarchyAllowed(items),
        );
        validation.execute("Reading Date Format", () => validator.validateReadingDateFormat(items));
        validation.execute("Null Reading Bundle", () => validator.validateNullReadingBundle(items));
        validation.execute("kWh Derivation", () => validator.validateKwhDerivation(items));
        validation.execute("Round5 Precision", () => validator.validateRound5Precision(items));
        validation.execute("Non Negative Readings", () =>
          validator.validateNonNegativeReadings(items),
        );
        validation.execute("Reading Dates When Present", () =>
          validator.validateReadingDatesWhenPresent(items),
        );
        validation.execute("MSN When Present", () => validator.validateMsnWhenPresent(items));
        validation.execute("No NaN", () => validator.validateNoNaN(items));
      }
      validation.printSummary(
        "Daily consumption — first page lists each consumer (readings may be empty)",
        responseTime,
      );
    },
  );
});
