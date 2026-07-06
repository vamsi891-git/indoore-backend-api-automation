import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { BulkUploadConsumersApi } from "../Api/bulk-upload-consumers.api";
import {
  bulkUploadConsumersMaxResponseTimeMs,
  bulkUploadConsumersTestCases,
  ensureBulkConsumerExistingCid,
  ensureBulkConsumerNearestAcctId,
  hasBulkConsumerExistingCid,
  hasBulkConsumerMeterPool,
  hasBulkConsumerNearestAcctId,
} from "../Data/bulk-upload-consumers.data";
import { ensureConsumerAssignableMeterPool } from "../../CONSUMERS/Data/consumer-assignable-meter-pool.data";
import { BulkUploadConsumersMapper } from "../Mapper/bulk-upload-consumers.mapper";
import { BulkUploadConsumersValidator } from "../Validator/bulk-upload-consumers.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import {
  BulkUploadConsumersRowOutcomeResponseSchema,
  BulkUploadConsumersSuccessResponseSchema,
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
  "row_meter_already_mapped",
  "row_consumer_id_exists",
]);

function shouldSkipForEnv(
  testCase: (typeof bulkUploadConsumersTestCases)[number],
): boolean {
  if (!testCase.envKeys?.length) {
    return false;
  }
  return testCase.envKeys.some((key) => !process.env[key]?.trim());
}

function needsAssignableMeter(
  testCase: (typeof bulkUploadConsumersTestCases)[number],
): boolean {
  if (FILE_ERROR_SCENARIOS.has(testCase.scenario)) {
    return false;
  }
  return !METER_SCENARIO_SCENARIOS.has(testCase.scenario);
}

function needsNearestAcctId(
  testCase: (typeof bulkUploadConsumersTestCases)[number],
): boolean {
  return ![
    "row_invalid_nearest_acct_id",
    "row_missing_nearest_acct_id",
  ].includes(testCase.scenario);
}

test.describe("Bulk Upload Consumers API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    const pool = await ensureConsumerAssignableMeterPool(authenticatedApi, {
      targetCount: 4,
      maxCreateAttempts: 15,
    });
    const nearestAcctId = await ensureBulkConsumerNearestAcctId(authenticatedApi);
    const existingCid = await ensureBulkConsumerExistingCid(authenticatedApi);
    console.log(
      `[bulk-upload-consumers] assignable meter pool (${pool.length}): ${pool.join(", ") || "empty"}`,
    );
    console.log(
      `[bulk-upload-consumers] nearest account id: ${nearestAcctId ?? "none"}`,
    );
    console.log(
      `[bulk-upload-consumers] existing consumer id: ${existingCid ?? "none"}`,
    );
  });

  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  });

  for (const testCase of bulkUploadConsumersTestCases) {
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
          testCase.scenario === "row_consumer_id_exists" &&
          !hasBulkConsumerExistingCid()
        ) {
          test.skip(
            true,
            "No existing Consumer ID resolved from consumer master for duplicate-CID test",
          );
          return;
        }

        if (
          BULK_SUCCESS_SCENARIOS.has(testCase.scenario) &&
          !hasBulkConsumerNearestAcctId()
        ) {
          test.skip(
            true,
            "No valid Nearest Acct. ID resolved for bulk-upload-consumers success scenarios",
          );
          return;
        }

        if (
          BULK_SUCCESS_SCENARIOS.has(testCase.scenario) &&
          !hasBulkConsumerMeterPool()
        ) {
          test.skip(
            true,
            "No assignable meters provisioned via add-meter for bulk-upload-consumers success scenarios",
          );
          return;
        }

        if (needsAssignableMeter(testCase) && !hasBulkConsumerMeterPool()) {
          test.skip(
            true,
            "No assignable meters provisioned via add-meter for bulk-upload-consumers field tests",
          );
          return;
        }

        if (
          needsNearestAcctId(testCase) &&
          !FILE_ERROR_SCENARIOS.has(testCase.scenario) &&
          !hasBulkConsumerNearestAcctId()
        ) {
          test.skip(
            true,
            "No valid Nearest Acct. ID resolved for bulk-upload-consumers field tests",
          );
          return;
        }

        const upload = await testCase.buildUpload();
        const api = new BulkUploadConsumersApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.bulkUploadConsumers(upload);

        if (testCase.scenario === "bulk_success") {
          console.log(JSON.stringify(responseBody, null, 2));
        }

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/master-data/bulk-upload-consumers`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new BulkUploadConsumersValidator();
        const mapped = BulkUploadConsumersMapper.map(responseBody);

        validation.execute("Status Validation", () =>
          expect(rawResponse.status()).toBe(testCase.expectedStatus),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            bulkUploadConsumersMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (BULK_SUCCESS_SCENARIOS.has(testCase.scenario)) {
          validation.execute("Zod Response Schema", () =>
            MasterDataCommonValidator.validateZodResponseSchema(
              responseBody,
              BulkUploadConsumersSuccessResponseSchema,
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
              BulkUploadConsumersRowOutcomeResponseSchema,
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
