import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrProfileApi } from "../Api/dtrprofile.api";
import {
  dtrProfileMaxResponseTimeMs,
  dtrProfileTestCases,
  resolveDtrProfileCode,
  resolveDtrProfileContractBody,
  resolveDtrProfileQuery,
} from "../Data/dtrprofile.data";
import {
  DtrProfileMapper,
  type DtrProfileErrorResponse,
} from "../Mapper/dtrprofile.mapper";
import { DtrProfileValidator } from "../Validator/dtrprofile.validator";

test.describe("DTR Profile API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrProfileTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrProfileValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrProfileContractBody(testCase.scenario);
          if (!fixtureBody) {
            test.skip(true, "Missing DTR profile contract fixture body");
            return;
          }

          const mapped = DtrProfileMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrProfileApi(authenticatedApi);
        const dtrCode = resolveDtrProfileCode(testCase.scenario);

        if (!dtrCode) {
          test.skip(true, "Could not resolve DTR profile code");
          return;
        }

        const query = resolveDtrProfileQuery(testCase.scenario);
        const queryString = new URLSearchParams(
          Object.entries(query).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            },
            {},
          ),
        ).toString();
        const endpoint = `/indore/dtr/${encodeURIComponent(dtrCode)}/profile${
          queryString ? `?${queryString}` : ""
        }`;

        const { rawResponse, responseBody, responseTime } =
          await api.getProfile(dtrCode, query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}${endpoint}`,
          responseTime,
        );

        validation.execute("Status Validation", () => {
          if (testCase.scenario === "dtr_not_found") {
            expect([200, 404]).toContain(rawResponse.status());
            return;
          }
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody);
        });
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            dtrProfileMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as DtrProfileErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (
          testCase.scenario === "dtr_not_found" &&
          rawResponse.status() === 404
        ) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as DtrProfileErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          validation.execute("Blank DTR Code Validation Error", () =>
            validator.validateBlankCodeError(
              responseBody as DtrProfileErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = DtrProfileMapper.map(responseBody);
        validation.execute("DTR Profile Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario, dtrCode.trim()),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
