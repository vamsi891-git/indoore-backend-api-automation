import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrPowerStatusApi } from "../Api/dtrpowerstatus.api";
import {
  dtrPowerStatusMaxResponseTimeMs,
  dtrPowerStatusTestCases,
  resolveDtrPowerStatusContractBody,
  resolveDtrPowerStatusExpectedPeriod,
  resolveDtrPowerStatusQuery,
} from "../Data/dtrpowerstatus.data";
import {
  DtrPowerStatusMapper,
  type DtrPowerStatusErrorResponse,
} from "../Mapper/dtrpowerstatus.mapper";
import { DtrPowerStatusValidator } from "../Validator/dtrpowerstatus.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Dashboard — DTR power on/off", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrPowerStatusTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new DtrPowerStatusValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveDtrPowerStatusContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing DTR power status contract body");
          return;
        }

        const mapped = DtrPowerStatusMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new DtrPowerStatusApi(authenticatedApi);
      const query = resolveDtrPowerStatusQuery(testCase.scenario);
      const expectedPeriod = resolveDtrPowerStatusExpectedPeriod(testCase.scenario);

      const { rawResponse, responseBody, responseTime } = await api.getDtrPowerStatus(query);

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
        assert.validateResponseTime(responseTime, dtrPowerStatusMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.scenario === "invalid_period") {
        validation.execute("Invalid Period Error", () =>
          validator.validateInvalidPeriodError(responseBody as DtrPowerStatusErrorResponse),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = DtrPowerStatusMapper.map(responseBody);
      validation.execute("Response Envelope", () =>
        validator.validateResponseEnvelope(responseBody),
      );
      validation.execute("DTR Power Status Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, expectedPeriod),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
