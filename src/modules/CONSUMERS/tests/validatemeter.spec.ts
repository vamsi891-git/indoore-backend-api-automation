import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { createConsumerData } from "../../MASTER-DATA/Data/create-consumer.data";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import {
  resolveValidateConsumerMeterSerial,
  validateMeterMaxResponseTimeMs,
  validateMeterTestCases,
} from "../Data/validatemeter.data";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import type { ValidateMeterErrorResponse } from "../Mapper/validatemeter.mapper";
import { ValidateMeterValidator } from "../Validator/validatemeter.validator";
import { ensureValidateConsumerMeterRuntimeContext } from "../utils/validate-consumer-meter-runtime.helper";

test.describe("Validate Meter API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureValidateConsumerMeterRuntimeContext(authenticatedApi);
  });

  for (const testCase of validateMeterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const organisationLookupId = testCase.includeOrganisationLookupId
          ? createConsumerData.organisationLookupId
          : undefined;

        if (
          testCase.scenario === "missing_meter_serial" ||
          testCase.scenario === "empty_meter_serial"
        ) {
          const params =
            testCase.scenario === "empty_meter_serial"
              ? new URLSearchParams({ meterSerialNumber: "" })
              : undefined;
          const url = params
            ? `/indore/consumers/validate-meter?${params}`
            : "/indore/consumers/validate-meter";
          const startedAt = Date.now();
          const rawResponse = await authenticatedApi.get(url);
          const responseTime = Date.now() - startedAt;
          const responseBody = (await rawResponse.json()) as
            | ValidateMeterErrorResponse
            | Record<string, unknown>;

          await PerformanceTracker.track(
            rawResponse,
            testCase.testName,
            `${process.env.BASE_URL}${url}`,
            responseTime,
          );

          const assert = new AssertionEngine();
          const validation = new ValidationEngine();
          const validator = new ValidateMeterValidator();

          validation.execute("Status Validation", () =>
            assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
          );
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as ValidateMeterErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        const meterSerialNumber = resolveValidateConsumerMeterSerial(
          testCase.scenario,
        );
        if (!meterSerialNumber) {
          test.skip(
            true,
            `Could not resolve ${testCase.envKey ?? "meter serial"} at runtime`,
          );
          return;
        }

        const api = new ValidateMeterApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.validateMeter(meterSerialNumber, organisationLookupId);

        const params = new URLSearchParams({
          meterSerialNumber,
        });
        if (organisationLookupId != null) {
          params.set("organisationLookupId", String(organisationLookupId));
        }

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/consumers/validate-meter?${params}`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new ValidateMeterValidator();
        const mapped = ValidateMeterMapper.map(responseBody);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            validateMeterMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        validation.execute("Response", () => validator.validateResponse(mapped));
        validation.execute("Root Structure", () =>
          validator.validateRootStructure(mapped.data),
        );
        validation.execute("Meter Exists Type", () =>
          validator.validateMeterExistsType(mapped.data),
        );
        validation.execute("Reason Type", () =>
          validator.validateReasonType(mapped.data),
        );
        validation.execute("Valid Reason Consistency", () =>
          validator.validateValidReasonConsistency(mapped.data),
        );
        validation.execute("Invalid Scenario Rules", () =>
          validator.validateInvalidScenario(mapped.data),
        );
        validation.execute("Scenario Outcome", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            meterSerialNumber,
          ),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
