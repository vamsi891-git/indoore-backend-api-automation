import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrPercentageLoadingDetailsApi } from "../Api/dtrpercentageloadingdetails.api";
import {
  dtrPercentageLoadingDetailsMaxResponseTimeMs,
  dtrPercentageLoadingDetailsTestCases,
  resolveDtrPercentageLoadingDetailsContractBody,
  resolveDtrPercentageLoadingDetailsQuery,
} from "../Data/dtrpercentageloadingdetails.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
  DtrPercentageLoadingDetailsMapper,
  type DtrPercentageLoadingDetailsErrorResponse,
} from "../Mapper/dtrpercentageloadingdetails.mapper";
import { DtrPercentageLoadingDetailsValidator } from "../Validator/dtrpercentageloadingdetails.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const PERCENTAGE_LOADING_DETAILS_PATH = "/indore/dashboard/dtr/percentage-loading-details";

test.describe("Dashboard — DTR loading list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrPercentageLoadingDetailsTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new DtrPercentageLoadingDetailsValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveDtrPercentageLoadingDetailsContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing DTR percentage-loading-details contract body");
          return;
        }

        const mapped = DtrPercentageLoadingDetailsMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new DtrPercentageLoadingDetailsApi(authenticatedApi);
      const query = resolveDtrPercentageLoadingDetailsQuery(testCase.scenario);

      const { rawResponse, responseBody, responseTime } =
        await api.getDtrPercentageLoadingDetails(query);

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
        assert.validateResponseTime(responseTime, dtrPercentageLoadingDetailsMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = DtrPercentageLoadingDetailsMapper.map(responseBody);
      validation.execute("Response Envelope", () =>
        validator.validateResponseEnvelope(responseBody),
      );
      validation.execute("DTR Percentage Loading Details Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, query),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("DTR loading list — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `${authCase.testName}`,
      {
        tag: [...authCase.tags, "@dtr-percentage-loading-details"],
      },
      async ({ unauthenticatedApi }) => {
        const validator = new DtrPercentageLoadingDetailsValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(PERCENTAGE_LOADING_DETAILS_PATH, {
          headers: authCase.headers,
          params: {
            band: "critical",
            page: 1,
            limit: 10,
          },
        });
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `DTR percentage-loading-details ${authCase.testName}`,
          )
        ) {
          authTest.skip(
            true,
            `Rate limited (429) on ${PERCENTAGE_LOADING_DETAILS_PATH} — retry later`,
          );
          return;
        }
        const responseBody = await rawResponse.json().catch(() => ({}));
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `DTR percentage-loading-details ${authCase.expectedErrorCode}`,
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
              responseBody as DtrPercentageLoadingDetailsErrorResponse,
            );
          } else if (authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode) {
            validator.validateUnauthorizedError(
              responseBody as DtrPercentageLoadingDetailsErrorResponse,
            );
          } else {
            validator.validateAuthError(
              responseBody as DtrPercentageLoadingDetailsErrorResponse,
              authCase.expectedErrorCode,
              authCase.expectedMessage,
            );
          }
        });

        validation.printSummary(
          `DTR Percentage Loading Details — ${authCase.expectedErrorCode}`,
          responseTime,
        );
      },
    );
  }
});
