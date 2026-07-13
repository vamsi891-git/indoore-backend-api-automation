import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrEventsApi } from "../Api/dtrevents.api";
import {
    dtrEventsMaxResponseTimeMs,
    dtrEventsTestCases,
    resolveDtrEventsCode,
    resolveDtrEventsContractBody,
    resolveDtrEventsQuery,
} from "../Data/dtrevents.data";
import {
    DtrEventsMapper,
    type DtrEventsErrorResponse,
} from "../Mapper/dtrevents.mapper";
import { DtrEventsValidator } from "../Validator/dtrevents.validator";

test.describe("DTR Events API", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of dtrEventsTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new DtrEventsValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();

                if (testCase.isContractFixture) {
                    const fixtureBody = resolveDtrEventsContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(true, "Missing DTR events contract fixture body");
                        return;
                    }

                    const query = resolveDtrEventsQuery(testCase.scenario);
                    const mapped = DtrEventsMapper.map(fixtureBody);
                    validation.execute("Required Fields", () =>
                        assert.validateRequiredFields(fixtureBody, [
                            "success",
                            "data",
                        ]),
                    );
                    validation.execute("Contract Scenario", () =>
                        validator.validateScenario(
                            mapped,
                            testCase.scenario,
                            query.page ?? 1,
                            query.limit ?? 20,
                        ),
                    );
                    validation.printSummary(testCase.testName, 0);
                    return;
                }

                const api = new DtrEventsApi(authenticatedApi);
                const dtrCode = resolveDtrEventsCode(testCase.scenario);

                if (!dtrCode) {
                    test.skip(true, "Could not resolve DTR events code");
                    return;
                }

                const query = resolveDtrEventsQuery(testCase.scenario);
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

                const { rawResponse, responseBody, responseTime } =
                    await api.getEvents(dtrCode, query);

                await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );

                validation.execute("Status Validation", () => {
                    if (testCase.scenario === "dtr_not_found") {
                        expect([200, 404]).toContain(rawResponse.status());
                        return;
                    }
                    assert.validateStatusCode(
                        rawResponse,
                        expectedStatus,
                        responseBody,
                    );
                });
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(
                        responseTime,
                        dtrEventsMaxResponseTimeMs,
                    ),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );

                if (expectedStatus === 404) {
                    validation.execute("Not Found Error", () =>
                        validator.validateNotFoundError(
                            responseBody as DtrEventsErrorResponse,
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
                            responseBody as DtrEventsErrorResponse,
                        ),
                    );
                    validation.printSummary(testCase.testName, responseTime);
                    return;
                }

                if (testCase.scenario === "empty_dtr_code") {
                    validation.execute("Blank DTR Code Validation Error", () =>
                        validator.validateBlankCodeError(
                            responseBody as DtrEventsErrorResponse,
                        ),
                    );
                    validation.printSummary(testCase.testName, responseTime);
                    return;
                }

                if (testCase.scenario === "invalid_page") {
                    validation.execute("Invalid Page Validation Error", () =>
                        validator.validateInvalidPageError(
                            responseBody as DtrEventsErrorResponse,
                        ),
                    );
                    validation.printSummary(testCase.testName, responseTime);
                    return;
                }

                validation.execute("Required Fields", () =>
                    assert.validateRequiredFields(responseBody, [
                        "success",
                        "data",
                    ]),
                );

                const mapped = DtrEventsMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("DTR Events Scenario", () =>
                    validator.validateScenario(
                        mapped,
                        testCase.scenario,
                        query.page ?? 1,
                        query.limit ?? 20,
                    ),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});
