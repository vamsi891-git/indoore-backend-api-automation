import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { EventLogListApi } from "../Api/eventloglist.api";
import {
  eventLogListMaxResponseTimeMs,
  eventLogListTestCases,
  resolveEventLogListContractBody,
  resolveEventLogListQuery,
  resolveEventLogListRef,
} from "../Data/eventloglist.data";
import {
  EventLogListMapper,
  type EventLogListErrorResponse,
} from "../Mapper/eventloglist.mapper";
import { EventLogListValidator } from "../Validator/eventloglist.validator";

test.describe("Event Log List API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of eventLogListTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new EventLogListValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const query = resolveEventLogListQuery(testCase.scenario);
        const eventPage = query.eventPage ?? 1;
        const eventPageSize = query.eventPageSize ?? 10;

        if (testCase.isContractFixture) {
          const fixtureBody = resolveEventLogListContractBody(testCase.scenario);
          if (!fixtureBody) {
            test.skip(true, "Missing event-log list contract fixture body");
            return;
          }

          const mapped = EventLogListMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario, {
              eventPage,
              eventPageSize,
            }),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new EventLogListApi(authenticatedApi);
        const consumerRef = resolveEventLogListRef(testCase.scenario);

        if (!consumerRef) {
          test.skip(true, "Could not resolve event-log list route ref");
          return;
        }

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
        const endpoint = `/indore/consumers/${consumerRef}/event-log/list${
          queryString ? `?${queryString}` : ""
        }`;

        const { rawResponse, responseBody, responseTime } =
          await api.getEventLogList(consumerRef, query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}${endpoint}`,
          responseTime,
        );

        validation.execute("Status Validation", () => {
          if (
            testCase.scenario === "meter_not_found" ||
            testCase.scenario === "consumer_not_found"
          ) {
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
            eventLogListMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as EventLogListErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (
          testCase.scenario === "meter_not_found" &&
          rawResponse.status() === 404
        ) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as EventLogListErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (
          testCase.scenario === "consumer_not_found" &&
          rawResponse.status() === 404
        ) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as EventLogListErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          validation.execute("Blank Ref Validation Error", () =>
            validator.validateBlankRefError(
              responseBody as EventLogListErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = EventLogListMapper.map(responseBody);
        validation.execute("Event Log List Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario, {
            eventPage,
            eventPageSize,
          }),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
