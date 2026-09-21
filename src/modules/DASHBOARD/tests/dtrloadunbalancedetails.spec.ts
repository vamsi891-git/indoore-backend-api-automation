import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrLoadUnbalanceDetailsApi } from "../Api/dtrloadunbalancedetails.api";
import {
  dtrLoadUnbalanceDetailsMaxResponseTimeMs,
  dtrLoadUnbalanceDetailsTestCases,
  resolveDtrLoadUnbalanceDetailsContractBody,
  resolveDtrLoadUnbalanceDetailsQuery,
} from "../Data/dtrloadunbalancedetails.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
  DtrLoadUnbalanceDetailsMapper,
  type DtrLoadUnbalanceDetailsErrorResponse,
} from "../Mapper/dtrloadunbalancedetails.mapper";
import { DtrLoadUnbalanceDetailsValidator } from "../Validator/dtrloadunbalancedetails.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const LOAD_UNBALANCE_DETAILS_PATH = "/indore/dashboard/dtr/load-unbalance-details";

test.describe("Dashboard — DTR load unbalance list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrLoadUnbalanceDetailsTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new DtrLoadUnbalanceDetailsValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveDtrLoadUnbalanceDetailsContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing DTR load-unbalance-details contract body");
          return;
        }

        const mapped = DtrLoadUnbalanceDetailsMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new DtrLoadUnbalanceDetailsApi(authenticatedApi);
      const query = resolveDtrLoadUnbalanceDetailsQuery(testCase.scenario);

      const { rawResponse, responseBody, responseTime } =
        await api.getDtrLoadUnbalanceDetails(query);

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
        assert.validateResponseTime(responseTime, dtrLoadUnbalanceDetailsMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = DtrLoadUnbalanceDetailsMapper.map(responseBody);
      validation.execute("Response Envelope", () =>
        validator.validateResponseEnvelope(responseBody),
      );
      validation.execute("DTR Load Unbalance Details Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, query),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("DTR load unbalance list — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `${authCase.testName}`,
      {
        tag: [...authCase.tags, "@dtr-load-unbalance-details"],
      },
      async ({ unauthenticatedApi }) => {
        const validator = new DtrLoadUnbalanceDetailsValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(LOAD_UNBALANCE_DETAILS_PATH, {
          headers: authCase.headers,
          params: {
            severity: "severe",
            page: 1,
            limit: 10,
          },
        });
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `DTR load-unbalance-details ${authCase.testName}`,
          )
        ) {
          authTest.skip(true, `Rate limited (429) on ${LOAD_UNBALANCE_DETAILS_PATH} — retry later`);
          return;
        }
        const responseBody = await rawResponse.json().catch(() => ({}));
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `DTR load-unbalance-details ${authCase.expectedErrorCode}`,
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
              responseBody as DtrLoadUnbalanceDetailsErrorResponse,
            );
          } else if (authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode) {
            validator.validateUnauthorizedError(
              responseBody as DtrLoadUnbalanceDetailsErrorResponse,
            );
          } else {
            validator.validateAuthError(
              responseBody as DtrLoadUnbalanceDetailsErrorResponse,
              authCase.expectedErrorCode,
              authCase.expectedMessage,
            );
          }
        });

        validation.printSummary(
          `DTR Load Unbalance Details — ${authCase.expectedErrorCode}`,
          responseTime,
        );
      },
    );
  }
});
