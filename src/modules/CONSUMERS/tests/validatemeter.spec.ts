import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { createConsumerData } from "../../MASTER-DATA/Data/create-consumer.data";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import {
  resolveValidateConsumerMeterSerial,
  validateMeterMaxResponseTimeMs,
  validateMeterTestCases,
} from "../Data/validatemeter.data";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import { ValidateMeterValidator } from "../Validator/validatemeter.validator";
import { ensureValidateConsumerMeterRuntimeContext } from "../utils/validate-consumer-meter-runtime.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Can this meter be given to a consumer?", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureValidateConsumerMeterRuntimeContext(authenticatedApi);
  });

  for (const testCase of validateMeterTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const organisationLookupId =
        testCase.includeOrganisationLookupId && Number(createConsumerData.organisationLookupId) > 0
          ? createConsumerData.organisationLookupId
          : undefined;
      const api = new ValidateMeterApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new ValidateMeterValidator();

      if (testCase.expectedStatus === 400) {
        const serial = resolveValidateConsumerMeterSerial(testCase.scenario);
        const rawParams: Record<string, string | number> = {
          ...(testCase.extraParams ?? {}),
        };
        if (testCase.scenario === "empty_meter_serial") {
          rawParams.meterSerialNumber = "";
        } else if (testCase.scenario === "whitespace_serial") {
          rawParams.meterSerialNumber = "   ";
        } else if (serial && testCase.scenario !== "missing_meter_serial") {
          rawParams.meterSerialNumber = serial;
        }

        const { rawResponse, responseBody, responseTime } = await api.validateMeterRaw(rawParams);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Validation Error", () =>
          validator.validateValidationError(
            responseBody,
            testCase.errorField ?? "meterSerialNumber",
          ),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      const meterSerialNumber = resolveValidateConsumerMeterSerial(testCase.scenario);
      if (!meterSerialNumber) {
        test.skip(true, `Could not resolve ${testCase.envKey ?? "meter serial"} at runtime`);
        return;
      }

      const requestSerial = testCase.padSerial ? `  ${meterSerialNumber}  ` : meterSerialNumber;

      if (testCase.duplicateGet) {
        const first = await api.validateMeter(requestSerial);
        const second = await api.validateMeter(requestSerial);

        await PerformanceTracker.track(
          second.rawResponse,
          testCase.testName,
          second.rawResponse.url(),
          second.responseTime,
        );

        const firstMapped = ValidateMeterMapper.map(first.responseBody);
        const secondMapped = ValidateMeterMapper.map(second.responseBody);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(second.rawResponse, 200, second.responseBody),
        );
        validation.execute("Duplicate GET consistency", () =>
          validator.validateDuplicateGetConsistency(firstMapped.data, secondMapped.data),
        );
        validation.execute("Scenario Outcome", () =>
          validator.validateScenario(secondMapped, testCase.scenario, meterSerialNumber),
        );
        validation.printSummary(testCase.testName, second.responseTime);
        return;
      }

      const { rawResponse, responseBody, responseTime } = await api.validateMeter(
        requestSerial,
        organisationLookupId,
        testCase.extraParams,
      );

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      const mapped = ValidateMeterMapper.map(responseBody);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
      );
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, validateMeterMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Response", () => validator.validateResponse(mapped));
      validation.execute("Root Structure", () => validator.validateRootStructure(mapped.data));
      validation.execute("Meter Exists Type", () => validator.validateMeterExistsType(mapped.data));
      validation.execute("Reason Type", () => validator.validateReasonType(mapped.data));
      validation.execute("Valid Reason Consistency", () =>
        validator.validateValidReasonConsistency(mapped.data),
      );
      validation.execute("Invalid Scenario Rules", () =>
        validator.validateInvalidScenario(mapped.data),
      );
      validation.execute("Scenario Outcome", () =>
        validator.validateScenario(mapped, testCase.scenario, meterSerialNumber),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
