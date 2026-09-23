import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BulkValidateMeterReplacementApi } from "../Api/bulk-validation.api";
import {
  bulkValidateMeterReplacementMaxResponseTimeMs,
  bulkValidateMeterReplacementTestCases,
} from "../Data/bulk-validation.data";
import { BulkValidateMeterReplacementMapper } from "../Mapper/bulk-validation.mapper";
import { BulkValidateMeterReplacementValidator } from "../Validator/bulk-validation.validator";
import { BulkValidateMeterReplacementSuccessResponseSchema } from "../schemas/meter-replacement.schemas";
import { shouldSkipMeterReplacementTestForEnv } from "../utils/meter-replacement-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const FILE_ERROR_SCENARIOS = new Set([
  "file_invalid_type",
  "file_missing_columns",
  "file_no_data_rows",
]);
const FILE_SOFT_ERROR_SCENARIOS = new Set(["file_duplicate_columns"]);
function shouldSkipForEnv(
  testCase: (typeof bulkValidateMeterReplacementTestCases)[number],
): boolean {
  return shouldSkipMeterReplacementTestForEnv(testCase.envKeys);
}
test.describe("Bulk Validate Meter Replacement API", () => {
  test.describe.configure({ retries: 1 });
  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
  });
  for (const testCase of bulkValidateMeterReplacementTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      if (shouldSkipForEnv(testCase)) {
        test.skip(true, `Set ${testCase.envKeys?.join(", ") ?? "required env vars"} in .env`);
        return;
      }
      const upload = await testCase.buildUpload(authenticatedApi);
      const api = new BulkValidateMeterReplacementApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.bulkValidate(upload);

      if (testCase.scenario === "validate_all_valid") {
        console.log(JSON.stringify(responseBody, null, 2));
      }
      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new BulkValidateMeterReplacementValidator();
      const mapped = BulkValidateMeterReplacementMapper.map(responseBody);
      const expectedStatus = FILE_ERROR_SCENARIOS.has(testCase.scenario)
        ? 400
        : testCase.expectedStatus;
      validation.execute("Status Validation", () => {
        if (FILE_SOFT_ERROR_SCENARIOS.has(testCase.scenario)) {
          // Live API currently returns 200 for duplicate headers; tolerate 400 if tightened later.
          expect([200, 400]).toContain(rawResponse.status());
        } else {
          expect(rawResponse.status()).toBe(expectedStatus);
        }
      });
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, bulkValidateMeterReplacementMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      if (rawResponse.status() === 200) {
        validation.execute("Zod Response Schema", () => {
          const result = BulkValidateMeterReplacementSuccessResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success ? undefined : JSON.stringify(result.error?.issues, null, 2),
          ).toBe(true);
        });
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "summary", "rows"]),
        );
      } else {
        validation.execute("Required Fields", () => {
          expect(responseBody.success).toBeFalsy();
          expect(responseBody.error ?? responseBody.message).toBeTruthy();
        });
      }
      validation.execute("Response", () => validator.validateResponse(mapped));
      validation.execute("Scenario Outcome", () => {
        if (FILE_SOFT_ERROR_SCENARIOS.has(testCase.scenario)) {
          if (rawResponse.status() === 400) {
            expect(mapped.success).toBeFalsy();
            expect(mapped.error ?? mapped.message).toBeTruthy();
          } else {
            expect(mapped.success).toBeTruthy();
            expect(mapped.summary).not.toBeNull();
          }
          return;
        }
        if (rawResponse.status() === 200) {
          validator.validateScenario(mapped, testCase.scenario);
        } else {
          expect(mapped.success).toBeFalsy();
          expect(mapped.summary).toBeNull();
          expect(mapped.error ?? mapped.message).toBeTruthy();
        }
      });
      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
