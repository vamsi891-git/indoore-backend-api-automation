import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrPowerTriangleApi } from "../Api/dtrpowertriangle.api";
import {
  dtrPowerTriangleMaxResponseTimeMs,
  dtrPowerTriangleTestCases,
  resolveDtrPowerTriangleCode,
  resolveDtrPowerTriangleContractBody,
  resolveDtrPowerTriangleQuery,
} from "../Data/dtrpowertriangle.data";
import {
  DtrPowerTriangleMapper,
  type DtrPowerTriangleErrorResponse,
} from "../Mapper/dtrpowertriangle.mapper";
import { DtrPowerTriangleValidator } from "../Validator/dtrpowertriangle.validator";

test.describe("DTR Power Triangle API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrPowerTriangleTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrPowerTriangleValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrPowerTriangleContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing DTR power triangle contract fixture body");
            return;
          }

          if (testCase.scenario === "contract_meter_data_unavailable") {
            validation.execute("Meter Data Unavailable Error", () =>
              validator.validateMeterDataUnavailableError(
                fixtureBody as DtrPowerTriangleErrorResponse,
              ),
            );
            validation.printSummary(testCase.testName, 0);
            return;
          }

          const mapped = DtrPowerTriangleMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrPowerTriangleApi(authenticatedApi);
        const dtrCode = resolveDtrPowerTriangleCode(testCase.scenario);

        if (!dtrCode) {
          test.skip(true, "Could not resolve DTR power triangle code");
          return;
        }

        const query = resolveDtrPowerTriangleQuery(testCase.scenario);
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
        const endpoint = `/indore/dtr/${encodeURIComponent(dtrCode)}/power-triangle${
          queryString ? `?${queryString}` : ""
        }`;

        const { rawResponse, responseBody, responseTime } =
          await api.getPowerTriangle(dtrCode, query);

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
          if (
            rawResponse.status() === 503 &&
            responseBody.success === false &&
            (responseBody as DtrPowerTriangleErrorResponse).error?.code ===
              "DTR_METER_DATA_UNAVAILABLE"
          ) {
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
            dtrPowerTriangleMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as DtrPowerTriangleErrorResponse,
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
              responseBody as DtrPowerTriangleErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          validation.execute("Blank DTR Code Validation Error", () =>
            validator.validateBlankCodeError(
              responseBody as DtrPowerTriangleErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        const isTimeoutFallback = rawResponse.status() === 503;
        const isMeterUnavailable =
          responseBody.success === false &&
          (responseBody as DtrPowerTriangleErrorResponse).error?.code ===
            "DTR_METER_DATA_UNAVAILABLE";

        if (isTimeoutFallback) {
          const mapped = DtrPowerTriangleMapper.map({
            success: true,
            data: undefined,
          });
          validation.execute("Timeout Fallback Status", () =>
            validator.validateTimeoutFallbackStatus(rawResponse.status()),
          );
          validation.execute("Timeout Fallback Triangle", () =>
            validator.validateTimeoutFallbackTriangle(mapped),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (isMeterUnavailable) {
          validation.execute("Meter Data Unavailable Error", () =>
            validator.validateMeterDataUnavailableError(
              responseBody as DtrPowerTriangleErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = DtrPowerTriangleMapper.map(responseBody);
        validation.execute("DTR Power Triangle Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
