import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CommunicationStatusApi } from "../Api/communicationstatus.api";
import {
  communicationStatusMaxResponseTimeMs,
  communicationStatusSampleDate,
  communicationStatusTestCases,
  resolveCommunicationStatusContractBody,
  resolveCommunicationStatusQuery,
  resolveCommunicationStatusRef,
} from "../Data/communicationstatus.data";
import {
  CommunicationStatusMapper,
  type CommunicationStatusErrorResponse,
} from "../Mapper/communicationstatus.mapper";
import { CommunicationStatusValidator } from "../Validator/communicationstatus.validator";

test.describe("Communication Status API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of communicationStatusTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new CommunicationStatusValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveCommunicationStatusContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing communication-status contract fixture body");
            return;
          }

          const mapped = CommunicationStatusMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new CommunicationStatusApi(authenticatedApi);
        const consumerRef = resolveCommunicationStatusRef(testCase.scenario);

        if (!consumerRef) {
          test.skip(true, "Could not resolve communication-status route ref");
          return;
        }

        const query = resolveCommunicationStatusQuery(testCase.scenario);
        const endpoint = `/indore/consumers/${consumerRef}/communication-status`;
        const { rawResponse, responseBody, responseTime } =
          await api.getCommunicationStatus(consumerRef, query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}${endpoint}`,
          responseTime,
        );

        validation.execute("Status Validation", () => {
          if (testCase.scenario === "meter_not_found") {
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
            communicationStatusMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as CommunicationStatusErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "meter_not_found" && rawResponse.status() === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as CommunicationStatusErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          if (testCase.scenario === "invalid_date") {
            validation.execute("Invalid Date Validation Error", () =>
              validator.validateInvalidDateError(
                responseBody as CommunicationStatusErrorResponse,
              ),
            );
          } else {
            validation.execute("Blank Ref Validation Error", () =>
              validator.validateBlankRefError(
                responseBody as CommunicationStatusErrorResponse,
              ),
            );
          }
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = CommunicationStatusMapper.map(responseBody);
        const expectedDate =
          testCase.scenario === "status_default_today"
            ? undefined
            : (typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
                ? query.date
                : communicationStatusSampleDate);

        validation.execute("Communication Status Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario, expectedDate),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
