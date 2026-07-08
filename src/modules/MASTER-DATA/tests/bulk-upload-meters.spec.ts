import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { BulkUploadMetersApi } from "../Api/bulk-upload-meters.api";
import {
  bulkUploadMetersMaxResponseTimeMs,
  bulkUploadMetersTestCases,
} from "../Data/bulk-upload-meters.data";
import { BulkUploadMetersMapper } from "../Mapper/bulk-upload-meters.mapper";
import { BulkUploadMetersValidator } from "../Validator/bulk-upload-meters.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import {
  BulkUploadMetersRowOutcomeResponseSchema,
  BulkUploadMetersSuccessResponseSchema,
} from "../schemas/master-data.schemas";
import { shouldSkipMasterDataTestForEnv } from "../utils/master-data-env.helper";
import { assertNegativeMasterDataHttpStatus } from "../utils/master-data-negative-outcome.helper";
import {
  ensureValidateMeterRuntimeContext,
  getValidateMeterSerial,
  runtimeMeterSerialEnvKey,
} from "../utils/validate-meter-runtime.helper";

const FILE_ERROR_SCENARIOS = new Set([
  "file_invalid_type",
  "file_missing_columns",
  "file_no_data_rows",
  "file_duplicate_columns",
  "file_manufacturer_invalid",
]);

const BULK_SUCCESS_SCENARIOS = new Set([
  "bulk_success",
  "bulk_success_multi",
  "bulk_success_blank_row",
]);

function shouldSkipForEnv(testCase: (typeof bulkUploadMetersTestCases)[number]): boolean {
  return shouldSkipMasterDataTestForEnv(testCase.envKeys);
}

function missingRuntimeMeterSerial(
  scenario: (typeof bulkUploadMetersTestCases)[number]["scenario"],
): boolean {
  const envKey = runtimeMeterSerialEnvKey(scenario);
  if (!envKey) {
    return false;
  }
  return !getValidateMeterSerial(envKey);
}

test.describe("Bulk Upload Meters API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureValidateMeterRuntimeContext(authenticatedApi);
  });

  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
  });

  for (const testCase of bulkUploadMetersTestCases) {
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

        if (missingRuntimeMeterSerial(testCase.scenario)) {
          test.skip(
            true,
            `Could not resolve runtime meter serial for ${testCase.scenario}`,
          );
          return;
        }

        const upload = await testCase.buildUpload();
        const api = new BulkUploadMetersApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.bulkUploadMeters(upload);

        if (testCase.scenario === "bulk_success") {
          console.log(JSON.stringify(responseBody, null, 2));
        }

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/master-data/bulk-upload-meters`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new BulkUploadMetersValidator();
        const mapped = BulkUploadMetersMapper.map(responseBody);

        validation.execute("Status Validation", () => {
          if (BULK_SUCCESS_SCENARIOS.has(testCase.scenario)) {
            expect(rawResponse.status()).toBe(testCase.expectedStatus);
            return;
          }
          assertNegativeMasterDataHttpStatus(
            rawResponse,
            testCase.expectedStatus,
          );
        });
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            bulkUploadMetersMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (BULK_SUCCESS_SCENARIOS.has(testCase.scenario)) {
          validation.execute("Zod Response Schema", () =>
            MasterDataCommonValidator.validateZodResponseSchema(
              responseBody,
              BulkUploadMetersSuccessResponseSchema,
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
              BulkUploadMetersRowOutcomeResponseSchema,
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
