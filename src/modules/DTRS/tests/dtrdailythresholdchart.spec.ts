import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrDailyThresholdChartApi } from "../Api/dtrdailythresholdchart.api";
import {
    dtrDailyThresholdChartMaxResponseTimeMs,
    dtrDailyThresholdChartTestCases,
    resolveDtrDailyThresholdChartCode,
    resolveDtrDailyThresholdChartContractBody,
    resolveDtrDailyThresholdChartPeriod,
    resolveDtrDailyThresholdChartQuery,
} from "../Data/dtrdailythresholdchart.data";
import {
    DtrDailyThresholdChartMapper,
    type DtrDailyThresholdChartErrorResponse,
} from "../Mapper/dtrdailythresholdchart.mapper";
import { DtrDailyThresholdChartValidator } from "../Validator/dtrdailythresholdchart.validator";

test.describe("DTR Daily Threshold Chart API", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of dtrDailyThresholdChartTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new DtrDailyThresholdChartValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                const expectedPeriod = resolveDtrDailyThresholdChartPeriod(
                    testCase.scenario,
                );

                if (testCase.isContractFixture) {
                    const fixtureBody = resolveDtrDailyThresholdChartContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(
                            true,
                            "Missing DTR daily threshold chart contract fixture body",
                        );
                        return;
                    }

                    const mapped = DtrDailyThresholdChartMapper.map(fixtureBody);
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
                            expectedPeriod,
                        ),
                    );
                    validation.printSummary(testCase.testName, 0);
                    return;
                }

                const api = new DtrDailyThresholdChartApi(authenticatedApi);
                const dtrCode = resolveDtrDailyThresholdChartCode(
                    testCase.scenario,
                );

                if (!dtrCode) {
                    test.skip(
                        true,
                        "Could not resolve DTR daily threshold chart code",
                    );
                    return;
                }

                const query = resolveDtrDailyThresholdChartQuery(
                    testCase.scenario,
                );
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
                const endpoint = `/indore/dtr/${encodeURIComponent(dtrCode)}/daily-threshold-chart?${queryString}`;

                const { rawResponse, responseBody, responseTime } =
                    await api.getDailyThresholdChart(dtrCode, query);

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
                        dtrDailyThresholdChartMaxResponseTimeMs,
                    ),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );

                if (expectedStatus === 404) {
                    validation.execute("Not Found Error", () =>
                        validator.validateNotFoundError(
                            responseBody as DtrDailyThresholdChartErrorResponse,
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
                            responseBody as DtrDailyThresholdChartErrorResponse,
                        ),
                    );
                    validation.printSummary(testCase.testName, responseTime);
                    return;
                }

                if (expectedStatus === 400) {
                    if (testCase.scenario === "invalid_period") {
                        validation.execute("Invalid Period Error", () =>
                            validator.validateInvalidPeriodError(
                                responseBody as DtrDailyThresholdChartErrorResponse,
                            ),
                        );
                    } else {
                        validation.execute("Blank DTR Code Validation Error", () =>
                            validator.validateBlankCodeError(
                                responseBody as DtrDailyThresholdChartErrorResponse,
                            ),
                        );
                    }
                    validation.printSummary(testCase.testName, responseTime);
                    return;
                }

                validation.execute("Required Fields", () =>
                    assert.validateRequiredFields(responseBody, [
                        "success",
                        "data",
                    ]),
                );

                const mapped = DtrDailyThresholdChartMapper.map(responseBody);
                validation.execute("DTR Daily Threshold Chart Scenario", () =>
                    validator.validateScenario(
                        mapped,
                        testCase.scenario,
                        expectedPeriod,
                    ),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});
