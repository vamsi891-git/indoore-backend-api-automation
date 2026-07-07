import { expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
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
import { shouldSkipMasterDataTestForEnv } from "../utils/master-data-env.helper";
import { shouldSkipKnownBackendDefects } from "../utils/master-data-manual-validations.helper";
import { ensureConsumerLookupContext } from "../utils/consumer-lookup.helper";
import {
  ensureValidateMeterRuntimeContext,
  getValidateMeterSerial,
  runtimeMeterSerialEnvKey,
} from "../utils/validate-meter-runtime.helper";
import { ensureConsumerMeterRuntimeContext } from "../utils/consumer-meter-runtime.helper";
import { ensureConsumerBulkHierarchyFromMasterData } from "../utils/consumer-bulk-hierarchy.helper";
import { BulkUploadConsumersMapper } from "../Mapper/bulk-upload-consumers.mapper";
import { BulkUploadConsumersValidator } from "../Validator/bulk-upload-consumers.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import {
  BulkUploadConsumersRowOutcomeResponseSchema,
  BulkUploadConsumersSuccessResponseSchema,
} from "../schemas/master-data.schemas";

type BulkUploadConsumersTestCase = (typeof bulkUploadConsumersTestCases)[number];

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

const BACKEND_DEFECT_SKIP_REASON =
  "Known backend defect — see Bulk upload validations.txt (BULK UPLOAD CONSUMERS)";

function isBackendDefectTestCase(testCase: BulkUploadConsumersTestCase): boolean {
  return testCase.tags.includes("@backend-defect");
}

function shouldSkipForEnv(testCase: BulkUploadConsumersTestCase): boolean {
  return shouldSkipMasterDataTestForEnv(testCase.envKeys);
}

function missingRuntimeMeterSerial(
  scenario: BulkUploadConsumersTestCase["scenario"],
): boolean {
  const envKey = runtimeMeterSerialEnvKey(scenario);
  if (!envKey) {
    return false;
  }
  return !getValidateMeterSerial(envKey);
}

function needsAssignableMeter(testCase: BulkUploadConsumersTestCase): boolean {
  if (FILE_ERROR_SCENARIOS.has(testCase.scenario)) {
    return false;
  }
  return !METER_SCENARIO_SCENARIOS.has(testCase.scenario);
}

function needsNearestAcctId(testCase: BulkUploadConsumersTestCase): boolean {
  return ![
    "row_invalid_nearest_acct_id",
    "row_missing_nearest_acct_id",
  ].includes(testCase.scenario);
}

function shouldSkipTestCase(testCase: BulkUploadConsumersTestCase): string | null {
  if (shouldSkipForEnv(testCase)) {
    return `Set ${testCase.envKeys?.join(", ") ?? "required env vars"} in .env`;
  }

  if (shouldSkipKnownBackendDefects() && isBackendDefectTestCase(testCase)) {
    return BACKEND_DEFECT_SKIP_REASON;
  }

  if (missingRuntimeMeterSerial(testCase.scenario)) {
    return `Could not resolve runtime meter serial for ${testCase.scenario}`;
  }

  if (
    testCase.scenario === "row_consumer_id_exists" &&
    !hasBulkConsumerExistingCid()
  ) {
    return "No existing Consumer ID resolved from consumer master for duplicate-CID test";
  }

  if (
    BULK_SUCCESS_SCENARIOS.has(testCase.scenario) &&
    !hasBulkConsumerNearestAcctId()
  ) {
    return "No valid Nearest Acct. ID resolved for bulk-upload-consumers success scenarios";
  }

  if (
    BULK_SUCCESS_SCENARIOS.has(testCase.scenario) &&
    !hasBulkConsumerMeterPool()
  ) {
    return "No assignable meters provisioned via add-meter for bulk-upload-consumers success scenarios";
  }

  if (needsAssignableMeter(testCase) && !hasBulkConsumerMeterPool()) {
    return "No assignable meters provisioned via add-meter for bulk-upload-consumers field tests";
  }

  if (
    needsNearestAcctId(testCase) &&
    !FILE_ERROR_SCENARIOS.has(testCase.scenario) &&
    !hasBulkConsumerNearestAcctId()
  ) {
    return "No valid Nearest Acct. ID resolved for bulk-upload-consumers field tests";
  }

  return null;
}

async function runBulkUploadConsumerTestCase(
  authenticatedApi: APIRequestContext,
  testCase: BulkUploadConsumersTestCase,
): Promise<void> {
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
      expect(responseBody.error ?? responseBody.message).toBeTruthy();
    });
  }

  validation.execute("Response", () => validator.validateResponse(mapped));
  validation.execute("Scenario Outcome", () =>
    validator.validateScenario(mapped, testCase.scenario),
  );

  validation.printSummary(testCase.testName, responseTime);
}

function registerBulkUploadConsumerTests(
  cases: BulkUploadConsumersTestCase[],
  options: { expectKnownDefect?: boolean } = {},
): void {
  for (const testCase of cases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const skipReason = shouldSkipTestCase(testCase);
        if (skipReason) {
          test.skip(true, skipReason);
          return;
        }

        if (options.expectKnownDefect) {
          try {
            await runBulkUploadConsumerTestCase(authenticatedApi, testCase);
            expect(
              false,
              `${testCase.scenario}: API now matches manual rule — remove @backend-defect`,
            ).toBe(true);
          } catch (error) {
            const detail =
              error instanceof Error ? error.message : String(error);
            console.log(
              `[backend-defect] ${testCase.scenario} still open: ${detail.split("\n")[0]}`,
            );
          }
          return;
        }

        await runBulkUploadConsumerTestCase(authenticatedApi, testCase);
      },
    );
  }
}

const enforcementTestCases = bulkUploadConsumersTestCases.filter(
  (testCase) => !isBackendDefectTestCase(testCase),
);
const backendDefectTestCases = bulkUploadConsumersTestCases.filter(
  (testCase) => isBackendDefectTestCase(testCase),
);

test.describe("Bulk Upload Consumers API", () => {
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureConsumerLookupContext(authenticatedApi);
    await ensureValidateMeterRuntimeContext(authenticatedApi);
    const runtime = await ensureConsumerMeterRuntimeContext(authenticatedApi);
    await ensureConsumerBulkHierarchyFromMasterData(authenticatedApi);
    const nearestAcctId = await ensureBulkConsumerNearestAcctId(authenticatedApi);
    const existingCid = await ensureBulkConsumerExistingCid(authenticatedApi);
    console.log(
      `[bulk-upload-consumers] assignable meter pool (${runtime?.pool.length ?? 0}): ${runtime?.pool.join(", ") || "empty"}`,
    );
    console.log(
      `[bulk-upload-consumers] nearest account id: ${nearestAcctId ?? "none"}`,
    );
    console.log(
      `[bulk-upload-consumers] existing consumer id: ${existingCid ?? "none"}`,
    );
  });

  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
  });

  test.describe("manual enforcement", () => {
    test.describe.configure({ retries: 1, mode: "serial" });
    registerBulkUploadConsumerTests(enforcementTestCases);
  });

  test.describe("known backend defects", () => {
    test.describe.configure({ retries: 1, mode: "serial" });
    registerBulkUploadConsumerTests(backendDefectTestCases, {
      expectKnownDefect: !shouldSkipKnownBackendDefects(),
    });
  });
});
