import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrCommunicationDetailsApi } from "../Api/dtrcommunicationdetails.api";
import {
  dtrCommunicationDetailsMaxResponseTimeMs,
  dtrCommunicationDetailsTestCases,
  resolveDtrCommunicationDetailsContractBody,
  resolveDtrCommunicationDetailsQuery,
} from "../Data/dtrcommunicationdetails.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
  DtrCommunicationDetailsMapper,
  type DtrCommunicationDetailsErrorResponse,
} from "../Mapper/dtrcommunicationdetails.mapper";
import { DtrCommunicationDetailsValidator } from "../Validator/dtrcommunicationdetails.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const COMMUNICATION_DETAILS_PATH = "/indore/dashboard/dtr/communication-details";

test.describe("Dashboard — DTR communication list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrCommunicationDetailsTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new DtrCommunicationDetailsValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveDtrCommunicationDetailsContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing DTR communication-details contract body");
          return;
        }

        const mapped = DtrCommunicationDetailsMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new DtrCommunicationDetailsApi(authenticatedApi);
      const query = resolveDtrCommunicationDetailsQuery(testCase.scenario);

      const { rawResponse, responseBody, responseTime } =
        await api.getDtrCommunicationDetails(query);

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
        assert.validateResponseTime(responseTime, dtrCommunicationDetailsMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.scenario === "dev_reject_legacy_status") {
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "error"]),
        );
        validation.execute("Legacy Status Validation", () =>
          validator.validateLegacyStatusValidationError(
            responseBody as DtrCommunicationDetailsErrorResponse,
          ),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = DtrCommunicationDetailsMapper.map(responseBody);
      validation.execute("Response Envelope", () =>
        validator.validateResponseEnvelope(responseBody),
      );
      validation.execute("DTR Communication Details Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, query),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("DTR communication list — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `${authCase.testName}`,
      {
        tag: [...authCase.tags, "@dtr-communication-details"],
      },
      async ({ unauthenticatedApi }) => {
        const validator = new DtrCommunicationDetailsValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(COMMUNICATION_DETAILS_PATH, {
          headers: authCase.headers,
          params: {
            status: "non-communicated",
            page: 1,
            limit: 10,
          },
        });
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `DTR communication-details ${authCase.testName}`,
          )
        ) {
          authTest.skip(true, `Rate limited (429) on ${COMMUNICATION_DETAILS_PATH} — retry later`);
          return;
        }
        const responseBody = await rawResponse.json().catch(() => ({}));
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `DTR communication-details ${authCase.expectedErrorCode}`,
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
              responseBody as DtrCommunicationDetailsErrorResponse,
            );
          } else if (authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode) {
            validator.validateUnauthorizedError(
              responseBody as DtrCommunicationDetailsErrorResponse,
            );
          } else {
            validator.validateAuthError(
              responseBody as DtrCommunicationDetailsErrorResponse,
              authCase.expectedErrorCode,
              authCase.expectedMessage,
            );
          }
        });

        validation.printSummary(
          `DTR Communication Details — ${authCase.expectedErrorCode}`,
          responseTime,
        );
      },
    );
  }
});
