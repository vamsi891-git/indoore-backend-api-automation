import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { PowerQualityApi } from "../Api/powerquality.api";
import {
  powerQualityMaxResponseTimeMs,
  powerQualityTestCases,
  resolvePowerQualityContractBody,
  resolvePowerQualityQuery,
  resolvePowerQualityRef,
} from "../Data/powerquality.data";
import {
  PowerQualityMapper,
  type PowerQualityErrorResponse,
} from "../Mapper/powerquality.mapper";
import { PowerQualityValidator } from "../Validator/powerquality.validator";

test.describe("Power Quality API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of powerQualityTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new PowerQualityValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolvePowerQualityContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing power-quality contract fixture body");
            return;
          }

          const mapped = PowerQualityMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new PowerQualityApi(authenticatedApi);
        const consumerRef = resolvePowerQualityRef(testCase.scenario);

        if (!consumerRef) {
          test.skip(true, "Could not resolve power-quality route ref");
          return;
        }

        const query = resolvePowerQualityQuery(testCase.scenario);
        const endpoint = `/indore/consumers/${consumerRef}/power-quality`;
        const { rawResponse, responseBody, responseTime } =
          await api.getPowerQuality(consumerRef, query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}${endpoint}`,
          responseTime,
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            powerQualityMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as PowerQualityErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          validation.execute("Blank Ref Validation Error", () =>
            validator.validateBlankRefError(
              responseBody as PowerQualityErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = PowerQualityMapper.map(responseBody);
        validation.execute("Power Quality Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
