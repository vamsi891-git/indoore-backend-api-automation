import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateConsumerApi } from "../Api/create-consumer.api";
import { ConsumerProfileApi } from "../../CONSUMERS/Api/consumerprofile.api";
import { ValidateMeterApi } from "../../CONSUMERS/Api/validatemeter.api";
import {
  createConsumerData,
  createConsumerMaxResponseTimeMs,
  createConsumerTestCases,
  ensureBulkConsumerExistingCid,
  ensureBulkConsumerNearestAcctId,
  hasBulkConsumerExistingCid,
  hasCreateConsumerMeterContext,
  hasCreateConsumerMeterPool,
  hasBulkConsumerNearestAcctId,
} from "../Data/create-consumer.data";
import { CreateConsumerMapper } from "../Mapper/create-consumer.mapper";
import { CreateConsumerValidator } from "../Validator/create-consumer.validator";
import { ValidateMeterMapper } from "../../CONSUMERS/Mapper/validatemeter.mapper";
import { shouldSkipMasterDataTestForEnv } from "../utils/master-data-env.helper";
import { ensureConsumerLookupContext } from "../utils/consumer-lookup.helper";
import {
  ensureValidateMeterRuntimeContext,
  getValidateMeterSerial,
  runtimeMeterSerialEnvKey,
} from "../utils/validate-meter-runtime.helper";
import { ensureConsumerMeterRuntimeContext } from "../utils/consumer-meter-runtime.helper";

const SUCCESS_SCENARIOS = new Set(["create_success"]);

const METER_SCENARIO_SCENARIOS = new Set([
  "meter_not_found",
  "meter_inactive",
  "meter_already_mapped",
  "consumer_id_exists",
]);

function shouldSkipForEnv(
  testCase: (typeof createConsumerTestCases)[number],
): boolean {
  return shouldSkipMasterDataTestForEnv(testCase.envKeys);
}

function missingRuntimeMeterSerial(
  scenario: (typeof createConsumerTestCases)[number]["scenario"],
): boolean {
  const envKey = runtimeMeterSerialEnvKey(scenario);
  if (!envKey) {
    return false;
  }
  return !getValidateMeterSerial(envKey);
}

function needsAssignableMeter(
  testCase: (typeof createConsumerTestCases)[number],
): boolean {
  return !METER_SCENARIO_SCENARIOS.has(testCase.scenario);
}

function needsNearestAcctId(
  testCase: (typeof createConsumerTestCases)[number],
): boolean {
  return !["invalid_nearest_acct_id", "missing_nearest_acct_id"].includes(
    testCase.scenario,
  );
}

test.describe("Create Consumer API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureConsumerLookupContext(authenticatedApi);
    await ensureValidateMeterRuntimeContext(authenticatedApi);
    const runtime = await ensureConsumerMeterRuntimeContext(authenticatedApi);
    const nearestAcctId = await ensureBulkConsumerNearestAcctId(authenticatedApi);
    const existingCid = await ensureBulkConsumerExistingCid(authenticatedApi);
    console.log(
      `[create-consumer] assignable meter pool (${runtime?.pool.length ?? 0}): ${runtime?.pool.join(", ") || "empty"}`,
    );
    console.log(
      `[create-consumer] dtr network lookup id: ${runtime?.networkLookupId ?? "none"}`,
    );
    console.log(
      `[create-consumer] existing consumer id: ${existingCid ?? "none"}`,
    );
  });

  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
  });

  for (const testCase of createConsumerTestCases) {
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

        if (needsAssignableMeter(testCase) && !hasCreateConsumerMeterPool()) {
          test.skip(
            true,
            "No assignable meters provisioned via add-meter for create-consumer tests",
          );
          return;
        }

        if (needsAssignableMeter(testCase) && !hasCreateConsumerMeterContext()) {
          test.skip(
            true,
            "validate-meter did not return organisationLookupId/networkLookupId for meter context",
          );
          return;
        }

        if (needsNearestAcctId(testCase) && !hasBulkConsumerNearestAcctId()) {
          test.skip(
            true,
            "No valid Nearest Acct. ID resolved from consumer master or env",
          );
          return;
        }

        if (
          testCase.scenario === "consumer_id_exists" &&
          !hasBulkConsumerExistingCid()
        ) {
          test.skip(
            true,
            "No existing Consumer ID from consumer master (optional: BULK_CONSUMER_EXISTS_CID)",
          );
          return;
        }

        const requestBody = testCase.buildPayload();
        const consumerCid = String(requestBody["Consumer ID"] ?? "");
        const api = new CreateConsumerApi(authenticatedApi);
        const profileApi = new ConsumerProfileApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.createConsumer(requestBody);

        if (testCase.scenario === "create_success") {
          console.log(JSON.stringify(responseBody, null, 2));
        }

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/consumers`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new CreateConsumerValidator();
        const mapped = CreateConsumerMapper.map(responseBody);

        validation.execute("Status Validation", () => {
          const statuses = testCase.acceptableStatuses ?? [
            testCase.expectedStatus,
          ];
          expect(statuses).toContain(rawResponse.status());
        });
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(responseTime, createConsumerMaxResponseTimeMs),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (SUCCESS_SCENARIOS.has(testCase.scenario)) {
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, [
              "success",
              "message",
              "data",
            ]),
          );
        } else {
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, ["success", "error"]),
          );
        }

        validation.execute("Response", () => validator.validateResponse(mapped));
        validation.execute("Scenario Outcome", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            requestBody,
            testCase.validationField,
          ),
        );

        if (testCase.scenario === "create_success" && mapped.isCreateSuccess) {
          const profileResult = await profileApi.getConsumerProfile(
            consumerCid,
            createConsumerData.profileQuery,
          );

          validation.execute("Post Create Profile Status", () =>
            assert.validateStatusCode(
              profileResult.rawResponse,
              200,
              profileResult.responseBody,
            ),
          );
          validation.execute("Post Create Profile Backend Rules", () =>
            validator.validatePostCreateProfileBackendRules(
              profileResult.responseBody,
              requestBody,
            ),
          );
        }

        if (
          testCase.scenario !== "create_success" &&
          consumerCid.trim().length > 0 &&
          !METER_SCENARIO_SCENARIOS.has(testCase.scenario)
        ) {
          const profileResult = await profileApi.getConsumerProfile(
            consumerCid,
            createConsumerData.profileQuery,
          );

          validation.execute("Consumer Not Persisted Status", () =>
            assert.validateStatusCode(
              profileResult.rawResponse,
              404,
              profileResult.responseBody,
            ),
          );
          validation.execute("Consumer Not Persisted", () =>
            validator.validatePostCreateConsumerNotFound(
              profileResult.responseBody,
            ),
          );
        }

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
