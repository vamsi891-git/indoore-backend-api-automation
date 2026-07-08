import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateDtrApi } from "../Api/create-dtr.api";
import {
  createDtrMaxResponseTimeMs,
  createDtrTestCases,
  hasCreateDtrExistsCode,
  hasResolvedUnmappedMeters,
} from "../Data/create-dtr.data";
import {
  ensureDtrAssignableMeterPool,
  provisionFreshDtrAssignableMeters,
} from "../Data/dtr-assignable-meter-pool.data";
import { ensureCreateDtrExistsCode } from "../utils/create-dtr-exists-code.helper";
import { shouldSkipMasterDataTestForEnv } from "../utils/master-data-env.helper";
import { shouldSkipKnownBackendDefects } from "../utils/master-data-manual-validations.helper";
import {
  ensureDtrTestRuntimeContext,
  getValidateMeterSerial,
  runtimeMeterSerialEnvKey,
} from "../utils/validate-meter-runtime.helper";
import { CreateDtrMapper } from "../Mapper/create-dtr.mapper";
import { CreateDtrValidator } from "../Validator/create-dtr.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { CreateDtrSuccessResponseSchema } from "../schemas/master-data.schemas";

const METER_SCENARIO_SCENARIOS = new Set([
  "meter_not_found",
  "meter_inactive",
  "meter_on_dtr",
  "meter_assigned",
  "dtr_code_exists",
]);

const SUCCESS_SCENARIOS = new Set<"success">(["success"]);

function needsAssignableMeter(
  testCase: (typeof createDtrTestCases)[number],
): boolean {
  return !METER_SCENARIO_SCENARIOS.has(testCase.scenario);
}

function shouldSkipForEnv(
  testCase: (typeof createDtrTestCases)[number],
): boolean {
  return shouldSkipMasterDataTestForEnv(testCase.envKeys);
}

function missingRuntimeMeterSerial(
  scenario: (typeof createDtrTestCases)[number]["scenario"],
): boolean {
  const envKey = runtimeMeterSerialEnvKey(scenario);
  if (!envKey) {
    return false;
  }
  return !getValidateMeterSerial(envKey);
}

test.describe("Create DTR API", () => {
  // Parallel-safe: do not use mode "serial" — one failure must not skip remaining cases.
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureDtrTestRuntimeContext(authenticatedApi);
    await ensureCreateDtrExistsCode(authenticatedApi);
    const pool = await ensureDtrAssignableMeterPool(authenticatedApi, {
      targetCount: 6,
      maxCreateAttempts: 15,
    });
    console.log(
      `[create-dtr] assignable meter pool (${pool.length}): ${pool.join(", ") || "empty"}`,
    );
  });

  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
  });

  for (const testCase of createDtrTestCases) {
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
          shouldSkipKnownBackendDefects() &&
          testCase.tags.includes("@backend-defect")
        ) {
          test.skip(
            true,
            "Known backend defect — see Bulk upload validations.txt (CREATE DTR)",
          );
          return;
        }

        if (testCase.scenario === "dtr_code_exists" && !hasCreateDtrExistsCode()) {
          await ensureCreateDtrExistsCode(authenticatedApi);
        }

        if (testCase.scenario === "dtr_code_exists" && !hasCreateDtrExistsCode()) {
          test.skip(
            true,
            "No existing DTR code found for duplicate-code test (set CREATE_DTR_EXISTS_CODE or seed DTR master)",
          );
          return;
        }

        if (needsAssignableMeter(testCase) && !hasResolvedUnmappedMeters()) {
          await ensureDtrAssignableMeterPool(authenticatedApi, {
            targetCount: 4,
            maxCreateAttempts: 12,
          });
        }

        if (needsAssignableMeter(testCase) && !hasResolvedUnmappedMeters()) {
          test.skip(
            true,
            "No assignable meters provisioned via add-meter for create-dtr tests",
          );
          return;
        }

        if (missingRuntimeMeterSerial(testCase.scenario)) {
          await ensureDtrTestRuntimeContext(authenticatedApi);
        }

        if (missingRuntimeMeterSerial(testCase.scenario)) {
          test.skip(
            true,
            `Could not resolve runtime meter serial for ${testCase.scenario}`,
          );
          return;
        }

        let requestBody = testCase.buildPayload();

        // Success must use a brand-new assignable meter — pool meters can be
        // consumed/stale after earlier negatives (esp. @backend-defect creates).
        if (testCase.scenario === "success") {
          const fresh = await provisionFreshDtrAssignableMeters(
            authenticatedApi,
            1,
            { maxCreateAttempts: 10 },
          );
          if (!fresh[0]) {
            test.skip(
              true,
              "Could not provision a fresh assignable meter for create-dtr success",
            );
            return;
          }
          requestBody = {
            ...requestBody,
            MSN: fresh[0],
          };
          console.log(`[create-dtr] success meter: ${fresh[0]}`);
          await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        }

        const api = new CreateDtrApi(authenticatedApi);
        let { rawResponse, responseBody, responseTime } =
          await api.createDtr(requestBody);

        // One retry on 409 for success — usually modem/SIM collision from prior runs.
        if (
          testCase.scenario === "success" &&
          rawResponse.status() === 409
        ) {
          console.warn(
            `[create-dtr] success got 409 — reprovisioning meter and unique modem fields`,
          );
          const retryMeters = await provisionFreshDtrAssignableMeters(
            authenticatedApi,
            1,
            { maxCreateAttempts: 10 },
          );
          if (retryMeters[0]) {
            requestBody = {
              ...testCase.buildPayload(),
              MSN: retryMeters[0],
            };
            await new Promise<void>((resolve) => setTimeout(resolve, 2000));
            ({ rawResponse, responseBody, responseTime } =
              await api.createDtr(requestBody));
          }
        }

        if (testCase.scenario === "success") {
          console.log(JSON.stringify(responseBody, null, 2));
        }

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/master-data/add-dtr`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new CreateDtrValidator();
        const mapped = CreateDtrMapper.map(responseBody);

        validation.execute("Status Validation", () => {
          if (testCase.expectedStatus === 201) {
            expect(rawResponse.status()).toBe(201);
            return;
          }
          const statuses = testCase.acceptableStatuses ?? [
            testCase.expectedStatus,
          ];
          const status = rawResponse.status();
          expect(
            status,
            "Invalid payload must not return HTTP 201 — backend accepted data that should be rejected",
          ).not.toBe(201);
          expect(statuses).toContain(status);
        });
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(responseTime, createDtrMaxResponseTimeMs),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (SUCCESS_SCENARIOS.has(testCase.scenario as "success")) {
          validation.execute("Zod Response Schema", () =>
            MasterDataCommonValidator.validateZodResponseSchema(
              responseBody,
              CreateDtrSuccessResponseSchema,
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

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
