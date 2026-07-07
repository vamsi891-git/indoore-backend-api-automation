import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ValidateDtrMeterApi } from "../Api/validate-dtr-meter.api";
import {
  validateDtrMeterMaxResponseTimeMs,
  validateDtrMeterNotFoundSerial,
  validateDtrMeterTestCases,
} from "../Data/validate-dtr-meter.data";
import { ValidateDtrMeterMapper } from "../Mapper/validate-dtr-meter.mapper";
import { ValidateDtrMeterValidator } from "../Validator/validate-dtr-meter.validator";
import {
  ensureValidateMeterRuntimeContext,
  getValidateDtrMeterSerialForScenario,
} from "../utils/validate-meter-runtime.helper";

test.describe("Validate DTR Meter API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureValidateMeterRuntimeContext(authenticatedApi);
  });

  for (const testCase of validateDtrMeterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const meterSerialNumber = getValidateDtrMeterSerialForScenario(
          testCase.scenario,
          validateDtrMeterNotFoundSerial,
        );
        if (!meterSerialNumber) {
          test.skip(
            true,
            `Could not resolve ${testCase.envKey ?? "meter serial"} at runtime`,
          );
          return;
        }

        const api = new ValidateDtrMeterApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.validateDtrMeter({
            meterSerialNumber,
          });

        const qs = new URLSearchParams({
          meterSerialNumber,
        }).toString();

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/master-data/validate-dtr-meter?${qs}`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new ValidateDtrMeterValidator();
        const mapped = ValidateDtrMeterMapper.map(responseBody);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            validateDtrMeterMaxResponseTimeMs,
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
        validation.execute("Meter Exists Type", () =>
          validator.validateMeterExistsType(mapped.data),
        );
        validation.execute("Invalid Scenario Rules", () =>
          validator.validateInvalidScenario(mapped.data),
        );
        validation.execute("Scenario Outcome", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
