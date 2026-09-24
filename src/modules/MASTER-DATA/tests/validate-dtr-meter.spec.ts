import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
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
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Master data — can this meter be put on a DTR?", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureValidateMeterRuntimeContext(authenticatedApi);
  });

  for (const testCase of validateDtrMeterTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const meterSerialNumber = getValidateDtrMeterSerialForScenario(
        testCase.scenario,
        validateDtrMeterNotFoundSerial,
      );
      if (!meterSerialNumber) {
        test.skip(
          true,
          `No meter serial for ${testCase.scenario}. Set ${testCase.envKey ?? "serial"} in .env or skip this case.`,
        );
        return;
      }

      const api = new ValidateDtrMeterApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.validateDtrMeter({
        meterSerialNumber,
      });

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new ValidateDtrMeterValidator();
      const mapped = ValidateDtrMeterMapper.map(responseBody);

      validation.execute("Status Validation", () => assert.validateStatusCode(rawResponse, 200));
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, validateDtrMeterMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Response", () => validator.validateResponse(mapped));
      validation.execute("Root Structure", () => validator.validateRootStructure(mapped.data));
      validation.execute("Reason Type", () => validator.validateReasonType(mapped.data));
      validation.execute("Meter Exists Type", () => validator.validateMeterExistsType(mapped.data));
      validation.execute("Invalid Scenario Rules", () =>
        validator.validateInvalidScenario(mapped.data),
      );
      validation.execute("Scenario Outcome", () =>
        validator.validateScenario(mapped, testCase.scenario),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
