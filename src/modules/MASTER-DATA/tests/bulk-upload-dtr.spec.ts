import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { BulkUploadDtrApi } from "../Api/bulk-upload-dtr.api";
import {
  bulkUploadDtrMaxResponseTimeMs,
  bulkUploadDtrTestCases,
  hasBulkDtrMeterPool,
} from "../Data/bulk-upload-dtr.data";
import { ensureDtrAssignableMeterPool } from "../Data/dtr-assignable-meter-pool.data";
import { BulkUploadDtrMapper } from "../Mapper/bulk-upload-dtr.mapper";
import { BulkUploadDtrValidator } from "../Validator/bulk-upload-dtr.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import {
  BulkUploadDtrRowOutcomeResponseSchema,
  BulkUploadDtrSuccessResponseSchema,
} from "../schemas/master-data.schemas";

const FILE_ERROR_SCENARIOS = new Set([
  "file_invalid_type",
  "file_missing_columns",
  "file_no_data_rows",
  "file_duplicate_columns",
  "file_invalid_zone",
]);

const BULK_SUCCESS_SCENARIOS = new Set([
  "bulk_success",
  "bulk_success_multi",
  "bulk_success_blank_row",
]);

const METER_SCENARIO_SCENARIOS = new Set([
  "row_meter_not_found",
  "row_meter_inactive",
  "row_meter_on_dtr",
  "row_dtr_code_exists",
]);

function shouldSkipForEnv(
  testCase: (typeof bulkUploadDtrTestCases)[number],
): boolean {
  if (!testCase.envKeys?.length) {
    return false;
  }
  return testCase.envKeys.some((key) => !process.env[key]?.trim());
}

function needsAssignableMeter(
  testCase: (typeof bulkUploadDtrTestCases)[number],
): boolean {
  if (FILE_ERROR_SCENARIOS.has(testCase.scenario)) {
    return false;
  }
  return !METER_SCENARIO_SCENARIOS.has(testCase.scenario);
}

test.describe("Bulk Upload DTR API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    const pool = await ensureDtrAssignableMeterPool(authenticatedApi, {
      targetCount: 4,
      maxCreateAttempts: 15,
    });
    console.log(
      `[bulk-upload-dtr] assignable meter pool (${pool.length}): ${pool.join(", ") || "empty"}`,
    );
  });

  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  });

  for (const testCase of bulkUploadDtrTestCases) {
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

        if (
          BULK_SUCCESS_SCENARIOS.has(testCase.scenario) &&
          !hasBulkDtrMeterPool()
        ) {
          test.skip(
            true,
            "No assignable meters provisioned via add-meter for bulk-upload-dtr success scenarios",
          );
          return;
        }

        if (needsAssignableMeter(testCase) && !hasBulkDtrMeterPool()) {
          test.skip(
            true,
            "No assignable meters provisioned via add-meter for bulk-upload-dtr field tests",
          );
          return;
        }

        const upload = await testCase.buildUpload();
        const api = new BulkUploadDtrApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.bulkUploadDtr(upload);

        if (testCase.scenario === "bulk_success") {
          console.log(JSON.stringify(responseBody, null, 2));
        }

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/master-data/bulk-upload-dtr`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new BulkUploadDtrValidator();
        const mapped = BulkUploadDtrMapper.map(responseBody);

        validation.execute("Status Validation", () =>
          expect(rawResponse.status()).toBe(testCase.expectedStatus),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            bulkUploadDtrMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (BULK_SUCCESS_SCENARIOS.has(testCase.scenario)) {
          validation.execute("Zod Response Schema", () =>
            MasterDataCommonValidator.validateZodResponseSchema(
              responseBody,
              BulkUploadDtrSuccessResponseSchema,
            ),
          );
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, [
              "success",
              "message",
              "data",
            ]),
          );
        } else if (!FILE_ERROR_SCENARIOS.has(testCase.scenario)) {
          validation.execute("Zod Response Schema", () =>
            MasterDataCommonValidator.validateZodResponseSchema(
              responseBody,
              BulkUploadDtrRowOutcomeResponseSchema,
            ),
          );
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, [
              "success",
              "message",
              "data",
            ]),
          );
        } else {
          validation.execute("Required Fields", () => {
            expect(responseBody.success).toBeFalsy();
            expect(
              responseBody.error ?? responseBody.message,
            ).toBeTruthy();
          });
        }

        validation.execute("Response", () => validator.validateResponse(mapped));
        validation.execute("Scenario Outcome", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
