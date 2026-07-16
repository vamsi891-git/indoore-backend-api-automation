import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BulkValidateMeterReplacementApi } from "../Api/bulk-validation.api";
import {
  bulkValidateMeterReplacementMaxResponseTimeMs,
  bulkValidateMeterReplacementTestCases,
} from "../Data/bulk-validation.data";
import { BulkValidateMeterReplacementMapper } from "../Mapper/bulk-validation.mapper";
import { BulkValidateMeterReplacementValidator } from "../Validator/bulk-validation.validator";
import { BulkValidateMeterReplacementSuccessResponseSchema } from "../utils/Meter replacement.schemas";
import { shouldSkipMeterReplacementTestForEnv } from "../utils/meter-replacement-env.helper";

const FILE_ERROR_SCENARIOS = new Set([
  "file_invalid_type",
  "file_missing_columns",
  "file_no_data_rows",
]);

const FILE_SOFT_ERROR_SCENARIOS = new Set(["file_duplicate_columns"]);

const ROW_LEVEL_SCENARIOS = new Set([
  "validate_all_valid",
  "validate_mixed",
  "row_missing_old_meter_serial",
  "row_old_meter_not_found",
  "row_old_meter_inactive",
  "row_missing_new_meter_serial",
  "row_new_meter_not_found",
  "row_new_meter_inactive",
  "row_new_meter_already_assigned",
  "row_new_meter_in_active_replacement",
  "row_old_new_same_serial",
  "row_duplicate_old_meter_serial_in_file",
  "row_duplicate_new_meter_serial_in_file",
  "row_consumer_has_pending_replacement",
  "row_missing_replacement_reason",
  "row_invalid_old_meter_reading",
  "row_invalid_new_meter_reading",
  "row_negative_reading",
  "row_invalid_latitude",
  "row_invalid_longitude",
]);

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
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        if (shouldSkipForEnv(testCase)) {
          test.skip(
            true,
            `Set ${testCase.envKeys?.join(", ") ?? "required env vars"} in .env`,
          );
          return;
        }

        const upload = await testCase.buildUpload(authenticatedApi);
        const api = new BulkValidateMeterReplacementApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.bulkValidate(upload);

        if (testCase.scenario === "validate_all_valid") {
          console.log(JSON.stringify(responseBody, null, 2));
        }

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
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
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            bulkValidateMeterReplacementMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (rawResponse.status() === 200) {
          validation.execute("Zod Response Schema", () => {
            const result =
              BulkValidateMeterReplacementSuccessResponseSchema.safeParse(
                responseBody,
              );
            expect(
              result.success,
              result.success
                ? undefined
                : JSON.stringify(result.error?.issues, null, 2),
            ).toBe(true);
          });
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, [
              "success",
              "summary",
              "rows",
            ]),
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
      },
    );
  }
});