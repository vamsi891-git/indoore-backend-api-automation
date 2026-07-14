import { test } from "../../../fixtures/api.fixture";
import { ProgressApi } from "../Api/progress.api";
import { progressData } from "../Data/progress.data";
import { ProgressMapper } from "../Mapper/progress.mapper";
import { ProgressValidator } from "../Validator/progress.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Meter Replacement Progress API", () => {
  test(
    "Validate Meter Replacement Progress API",
    {
      tag: [
        "@meter-replacement",
        "@progress",
        "@smoke",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new ProgressApi(authenticatedApi);
      const { maxResponseTime } = progressData;

      const { rawResponse, responseBody, responseTime } =
        await api.getProgress();

      await PerformanceTracker.track(
        rawResponse,
        "Meter Replacement Progress API",
        rawResponse.url(),
        responseTime,
      );

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ProgressValidator();

      // ----------------------------------------------------
      // Assertion Engine
      // ----------------------------------------------------

      validation.execute("Status Code", () =>
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

      validation.execute("Required Root Fields", () =>
        assert.validateRequiredFields(responseBody, [
          "success",
          "data",
        ]),
      );

      validation.execute("Required Data Fields", () =>
        assert.validateRequiredFields(responseBody.data, [
          "weekly",
          "monthly",
        ]),
      );

      // ----------------------------------------------------
      // Mapper
      // ----------------------------------------------------

      const mapped = ProgressMapper.map(responseBody);
      const { weekly, monthly } = mapped;

      // ----------------------------------------------------
      // Validator — Positive / Edge / Business
      // ----------------------------------------------------

      validation.execute("Success", () =>
        validator.validateSuccess(mapped.success),
      );

      validation.execute("Root Structure", () =>
        validator.validateRootStructure(mapped),
      );

      validation.execute("Required Chart Roots", () =>
        validator.validateRequiredRootFields(mapped),
      );

      validation.execute("Weekly Object", () =>
        validator.validateWeeklyObject(weekly),
      );

      validation.execute("Monthly Object", () =>
        validator.validateMonthlyObject(monthly),
      );

      validation.execute("Weekly Required Fields", () =>
        validator.validateChartRequiredFields(weekly),
      );

      validation.execute("Monthly Required Fields", () =>
        validator.validateChartRequiredFields(monthly),
      );

      validation.execute("Weekly Types", () =>
        validator.validateChartTypes(weekly),
      );

      validation.execute("Monthly Types", () =>
        validator.validateChartTypes(monthly),
      );

      validation.execute("Charts Are Plain Objects", () =>
        validator.validateChartsArePlainObjects(mapped),
      );

      validation.execute("Weekly Bucket Count", () =>
        validator.validateWeeklyBucketCount(weekly),
      );

      validation.execute("Monthly Bucket Count", () =>
        validator.validateMonthlyBucketCount(monthly),
      );

      validation.execute("Weekly Labels", () =>
        validator.validateWeeklyLabels(weekly),
      );

      validation.execute("Monthly Labels", () =>
        validator.validateMonthlyLabels(monthly),
      );

      validation.execute("Weekly Ordered Labels", () =>
        validator.validateWeeklyOrderedLabels(weekly),
      );

      validation.execute("Monthly Ordered Labels", () =>
        validator.validateMonthlyOrderedLabels(monthly),
      );

      validation.execute("Weekly Label Format", () =>
        validator.validateWeeklyLabelFormat(weekly),
      );

      validation.execute("Monthly Label Format", () =>
        validator.validateMonthlyLabelFormat(monthly),
      );

      validation.execute("Weekly Labels Are Strings", () =>
        validator.validateLabelsAreStrings(weekly),
      );

      validation.execute("Monthly Labels Are Strings", () =>
        validator.validateLabelsAreStrings(monthly),
      );

      validation.execute("Weekly Labels Trimmed", () =>
        validator.validateLabelsTrimmed(weekly),
      );

      validation.execute("Monthly Labels Trimmed", () =>
        validator.validateLabelsTrimmed(monthly),
      );

      validation.execute("Weekly Labels Not Empty", () =>
        validator.validateLabelsNotEmpty(weekly),
      );

      validation.execute("Monthly Labels Not Empty", () =>
        validator.validateLabelsNotEmpty(monthly),
      );

      validation.execute("Weekly Unique Labels", () =>
        validator.validateUniqueLabels(weekly),
      );

      validation.execute("Monthly Unique Labels", () =>
        validator.validateUniqueLabels(monthly),
      );

      validation.execute("No Extra Weekly Label", () =>
        validator.validateNoExtraWeeklyLabel(weekly),
      );

      validation.execute("No Extra Monthly Label", () =>
        validator.validateNoExtraMonthlyLabel(monthly),
      );

      validation.execute("Weekly Values Are Numbers", () =>
        validator.validateValuesAreNumbers(weekly),
      );

      validation.execute("Monthly Values Are Numbers", () =>
        validator.validateValuesAreNumbers(monthly),
      );

      validation.execute("Weekly Values Are Integers", () =>
        validator.validateValuesAreIntegers(weekly),
      );

      validation.execute("Monthly Values Are Integers", () =>
        validator.validateValuesAreIntegers(monthly),
      );

      validation.execute("Weekly Values Non Negative", () =>
        validator.validateValuesNonNegative(weekly),
      );

      validation.execute("Monthly Values Non Negative", () =>
        validator.validateValuesNonNegative(monthly),
      );

      validation.execute("Weekly Values Safe Integer", () =>
        validator.validateValuesSafeInteger(weekly),
      );

      validation.execute("Monthly Values Safe Integer", () =>
        validator.validateValuesSafeInteger(monthly),
      );

      validation.execute("Weekly Values Not Null", () =>
        validator.validateValuesNotNull(weekly),
      );

      validation.execute("Monthly Values Not Null", () =>
        validator.validateValuesNotNull(monthly),
      );

      validation.execute("Weekly Length Parity", () =>
        validator.validateLabelsValuesLengthParity(weekly),
      );

      validation.execute("Monthly Length Parity", () =>
        validator.validateLabelsValuesLengthParity(monthly),
      );

      validation.execute("Weekly Values Count Match", () =>
        validator.validateWeeklyValuesCountMatch(weekly),
      );

      validation.execute("Monthly Values Count Match", () =>
        validator.validateMonthlyValuesCountMatch(monthly),
      );

      validation.execute("Weekly Chart Object Size", () =>
        validator.validateChartObjectSize(weekly),
      );

      validation.execute("Monthly Chart Object Size", () =>
        validator.validateChartObjectSize(monthly),
      );

      validation.execute("Weekly No Extra Fields", () =>
        validator.validateChartNoExtraFields(weekly),
      );

      validation.execute("Monthly No Extra Fields", () =>
        validator.validateChartNoExtraFields(monthly),
      );

      validation.execute("Root Object Size", () =>
        validator.validateRootObjectSize(mapped),
      );

      validation.execute("No Extra Root Fields", () =>
        validator.validateNoExtraRootFields(mapped),
      );

      validation.execute("No Null Critical Fields", () =>
        validator.validateNoNullCriticalFields(mapped),
      );

      validation.execute("No Undefined Critical Fields", () =>
        validator.validateNoUndefinedCriticalFields(mapped),
      );

      validation.execute("Response Integrity", () =>
        validator.validateResponseIntegrity(mapped),
      );

      validation.execute("Weekly Monthly Independence", () =>
        validator.validateWeeklyMonthlyIndependence(mapped),
      );

      validation.execute("Zero Progress Scenario", () =>
        validator.validateZeroProgressScenario(mapped),
      );

      validation.execute("Weekly Sum Non Negative", () =>
        validator.validateWeeklySumNonNegative(weekly),
      );

      validation.execute("Monthly Sum Non Negative", () =>
        validator.validateMonthlySumNonNegative(monthly),
      );

      validation.execute("Business Rules", () =>
        validator.validateBusinessRules(mapped),
      );

      validation.printSummary(
        "Meter Replacement Progress API",
        responseTime,
      );
    },
  );
});
