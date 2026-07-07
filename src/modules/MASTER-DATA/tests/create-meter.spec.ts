import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateMeterApi } from "../Api/create-meter.api";
import {
  createMeterMaxResponseTimeMs,
  createMeterTestCases,
} from "../Data/create-meter.data";
import { CreateMeterMapper } from "../Mapper/create-meter.mapper";
import { CreateMeterValidator } from "../Validator/create-meter.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { CreateMeterSuccessResponseSchema } from "../schemas/master-data.schemas";
import { ensureMeterManufacturerContext } from "../utils/meter-manufacturer.helper";
import { ensureValidateMeterRuntimeContext } from "../utils/validate-meter-runtime.helper";

const SUCCESS_SCENARIOS = new Set([
  "success",
  "success_matching_asset",
  "success_active_status",
]);

test.describe("Create Meter API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureMeterManufacturerContext(authenticatedApi);
    await ensureValidateMeterRuntimeContext(authenticatedApi);
  });

  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  });

  for (const testCase of createMeterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const requestBody = testCase.buildPayload();

        if (testCase.envKey && !requestBody.meterSerialNumber) {
          test.skip(
            true,
            `Could not resolve ${testCase.envKey} at runtime`,
          );
          return;
        }

        const api = new CreateMeterApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.createMeter(requestBody);
        if (testCase.scenario === "success")
          console.log(JSON.stringify(responseBody, null, 2));

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/master-data/add-meter`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new CreateMeterValidator();
        const mapped = CreateMeterMapper.map(responseBody);

        validation.execute("Status Validation", () =>
          expect(rawResponse.status()).toBe(testCase.expectedStatus),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(responseTime, createMeterMaxResponseTimeMs),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (SUCCESS_SCENARIOS.has(testCase.scenario)) {
          validation.execute("Zod Response Schema", () =>
            MasterDataCommonValidator.validateZodResponseSchema(
              responseBody,
              CreateMeterSuccessResponseSchema,
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
