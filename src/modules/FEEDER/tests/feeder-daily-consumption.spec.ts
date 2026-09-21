import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { FeederDailyConsumptionApi } from "../Api/feeder-daily-consumption.api";
import { feederDailyConsumptionData } from "../Data/feeder-daily-consumption.data";
import { FeederDailyConsumptionMapper } from "../Mapper/feeder-daily-consumption.mapper";
import { FeederDailyConsumptionValidator } from "../Validator/feeder-daily-consumption.validator";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { FeederDailyConsumptionSuccessResponseSchema } from "../schemas/feeder.schemas";
import { resolveFeederCode, skipIfFeederInternalError } from "../utils/feeder-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Feeder daily energy", () => {
  test(
    "Feeder daily energy — day-by-day kWh (an empty chart is still OK)",
    {
      tag: ["@feeder", "@daily-consumption", "@smoke"],
    },
    async ({ authenticatedApi }) => {
      const api = new FeederDailyConsumptionApi(authenticatedApi);
      const { granularity, expectedUnit, maxResponseTime } = feederDailyConsumptionData;
      const feederCode = resolveFeederCode(feederDailyConsumptionData.feederCode);

      const { rawResponse, responseBody, responseTime } = await api.getDailyConsumption(
        feederCode,
        granularity,
      );

      await PerformanceTracker.track(
        rawResponse,
        "Feeder daily energy — day-by-day kWh (an empty chart is still OK)",
        rawResponse.url(),
        responseTime,
      );
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${feederCode}/daily-consumption`,
      );

      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new FeederDailyConsumptionValidator();

      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200, responseBody));
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, maxResponseTime),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody.data, ["granularity", "unit", "points"]),
      );
      if (rawResponse.status() === 200) {
        validation.execute("Zod Response Schema", () => {
          const result = FeederDailyConsumptionSuccessResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
      }

      const mapped = FeederDailyConsumptionMapper.map(responseBody);
      const { points } = mapped;

      validation.execute("Success", () => validator.validateSuccess(mapped.success));
      validation.execute("Root Structure", () => validator.validateRootStructure(mapped));
      validation.execute("Granularity Echo", () =>
        validator.validateGranularityEcho(mapped, granularity),
      );
      validation.execute("Unit", () => validator.validateUnit(mapped, expectedUnit));
      validation.execute("Empty Scenario", () => validator.validateEmptyScenario(mapped));
      validation.execute("Business Rules", () => validator.validateBusinessRules(mapped));
      validation.execute("Day Point Count", () => validator.validateDayPointCount(points));

      if (points.length > 0) {
        validation.execute("Point Required Fields", () =>
          validator.validatePointRequiredFields(points),
        );
        validation.execute("Point Structure", () => validator.validatePointStructure(points));
        validation.execute("Day Label Format", () => validator.validateDayLabelFormat(points));
        validation.execute("Day Key Format", () => validator.validateDayKeyFormat(points));
        validation.execute("Label Key Alignment", () =>
          validator.validateLabelKeyAlignment(points),
        );
        validation.execute("kWh Values", () => validator.validateKwhValues(points));
        validation.execute("Unique Keys", () => validator.validateUniqueKeys(points));
        validation.execute("Chronological Order", () =>
          validator.validateChronologicalOrder(points),
        );
        validation.execute("Consecutive Days", () => validator.validateConsecutiveDays(points));
      }

      validation.printSummary(
        "Feeder daily energy — day-by-day kWh (an empty chart is still OK)",
        responseTime,
      );
    },
  );
});
