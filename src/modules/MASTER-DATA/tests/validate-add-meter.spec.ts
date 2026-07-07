import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ValidateAddMeterApi } from "../Api/validate-add-meter.api";
import {
  resolveValidateAddMeterSerial,
  validateAddMeterMaxResponseTimeMs,
  validateAddMeterTestCases,
} from "../Data/validate-add-meter.data";
import { ValidateAddMeterMapper } from "../Mapper/validate-add-meter.mapper";
import { ValidateAddMeterValidator } from "../Validator/validate-add-meter.validator";
import { ensureValidateMeterRuntimeContext } from "../utils/validate-meter-runtime.helper";

test.describe("Validate Add Meter API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureValidateMeterRuntimeContext(authenticatedApi);
  });

  for (const testCase of validateAddMeterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const meterSerialNumber = resolveValidateAddMeterSerial(testCase.scenario);
        if (!meterSerialNumber) {
          test.skip(
            true,
            `Could not resolve ${testCase.envKey} at runtime (provision or set .env override)`,
          );
          return;
        }

        const api = new ValidateAddMeterApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.validateAddMeter({
            meterSerialNumber,
          });

        const qs = new URLSearchParams({
          meterSerialNumber,
        }).toString();

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/master-data/validate-add-meter?${qs}`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new ValidateAddMeterValidator();
        const mapped = ValidateAddMeterMapper.map(responseBody);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            validateAddMeterMaxResponseTimeMs,
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
        validation.execute("Reason Type", () =>
          validator.validateReasonType(mapped.data),
        );
        validation.execute("Message Type", () =>
          validator.validateMessageType(mapped.data),
        );
        validation.execute("Valid Reason Consistency", () =>
          validator.validateValidReasonConsistency(mapped.data),
        );
        validation.execute("Scenario Outcome", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
