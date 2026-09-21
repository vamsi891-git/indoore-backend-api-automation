import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrPowerStatusDetailsApi } from "../Api/dtrpowerstatusdetails.api";
import {
  dtrPowerStatusDetailsMaxResponseTimeMs,
  dtrPowerStatusDetailsTestCases,
  resolveDtrPowerStatusDetailsContractBody,
  resolveDtrPowerStatusDetailsQuery,
} from "../Data/dtrpowerstatusdetails.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
  DtrPowerStatusDetailsMapper,
  type DtrPowerStatusDetailsErrorResponse,
} from "../Mapper/dtrpowerstatusdetails.mapper";
import { DtrPowerStatusDetailsValidator } from "../Validator/dtrpowerstatusdetails.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const POWER_STATUS_DETAILS_PATH = "/indore/dashboard/dtr/power-status-details";

test.describe("Dashboard — DTR power on/off list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrPowerStatusDetailsTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new DtrPowerStatusDetailsValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveDtrPowerStatusDetailsContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing DTR power-status-details contract body");
          return;
        }

        const mapped = DtrPowerStatusDetailsMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new DtrPowerStatusDetailsApi(authenticatedApi);
      const query = resolveDtrPowerStatusDetailsQuery(testCase.scenario);

      const { rawResponse, responseBody, responseTime } = await api.getDtrPowerStatusDetails(query);

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
        assert.validateResponseTime(responseTime, dtrPowerStatusDetailsMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = DtrPowerStatusDetailsMapper.map(responseBody);
      validation.execute("Response Envelope", () =>
        validator.validateResponseEnvelope(responseBody),
      );
      validation.execute("DTR Power Status Details Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, query),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("DTR power on/off list — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `${authCase.testName}`,
      {
        tag: [...authCase.tags, "@dtr-power-status-details"],
      },
      async ({ unauthenticatedApi }) => {
        const validator = new DtrPowerStatusDetailsValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(POWER_STATUS_DETAILS_PATH, {
          headers: authCase.headers,
          params: {
            status: "on",
            page: 1,
            limit: 10,
          },
        });
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `DTR power-status-details ${authCase.testName}`,
          )
        ) {
          authTest.skip(true, `Rate limited (429) on ${POWER_STATUS_DETAILS_PATH} — retry later`);
          return;
        }
        const responseBody = await rawResponse.json().catch(() => ({}));
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `DTR power-status-details ${authCase.expectedErrorCode}`,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status (auth negative)", () =>
          assert.validateStatusCode(rawResponse, authCase.expectedStatus, responseBody),
        );
        validation.execute("Content Type", () => assert.validateContentType(rawResponse));
        validation.execute("Auth Error Envelope", () => {
          if (authCase.expectedErrorCode === dtrUnbalanceAccessTokenInvalidCode) {
            validator.validateAccessTokenInvalidError(
              responseBody as DtrPowerStatusDetailsErrorResponse,
            );
          } else if (authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode) {
            validator.validateUnauthorizedError(responseBody as DtrPowerStatusDetailsErrorResponse);
          } else {
            validator.validateAuthError(
              responseBody as DtrPowerStatusDetailsErrorResponse,
              authCase.expectedErrorCode,
              authCase.expectedMessage,
            );
          }
        });

        validation.printSummary(
          `DTR Power Status Details — ${authCase.expectedErrorCode}`,
          responseTime,
        );
      },
    );
  }
});
