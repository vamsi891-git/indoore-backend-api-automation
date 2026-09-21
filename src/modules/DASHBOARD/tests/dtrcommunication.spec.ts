import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrCommunicationApi } from "../Api/dtrcommunication.api";
import {
  dtrCommunicationMaxResponseTimeMs,
  dtrCommunicationTestCases,
  resolveDtrCommunicationContractBody,
  resolveDtrCommunicationExpectedPeriod,
  resolveDtrCommunicationQuery,
} from "../Data/dtrcommunication.data";
import {
  DtrCommunicationMapper,
  type DtrCommunicationErrorResponse,
} from "../Mapper/dtrcommunication.mapper";
import { DtrCommunicationValidator } from "../Validator/dtrcommunication.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Dashboard — DTR communication", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrCommunicationTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new DtrCommunicationValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveDtrCommunicationContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing DTR communication contract body");
          return;
        }

        const mapped = DtrCommunicationMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new DtrCommunicationApi(authenticatedApi);
      const query = resolveDtrCommunicationQuery(testCase.scenario);
      const expectedPeriod = resolveDtrCommunicationExpectedPeriod(testCase.scenario);
      const queryString = new URLSearchParams(
        Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = String(value);
          }
          return acc;
        }, {}),
      ).toString();

      const { rawResponse, responseBody, responseTime } =
        await api.getDtrCommunicationStatus(query);

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, dtrCommunicationMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.scenario === "invalid_period") {
        validation.execute("Invalid Period Error", () =>
          validator.validateInvalidPeriodError(responseBody as DtrCommunicationErrorResponse),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = DtrCommunicationMapper.map(responseBody);
      validation.execute("Response Envelope", () =>
        validator.validateResponseEnvelope(responseBody),
      );
      validation.execute("DTR Communication Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, expectedPeriod),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
