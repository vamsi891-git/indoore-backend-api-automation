import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import {
    dashboardMetricsMaxResponseTimeMs,
    dashboardMetricsTestCases,
    resolveDashboardMetricsContractBody,
    resolveDashboardMetricsQuery,
} from "../Data/dashboardmetrics.data";
import { DashboardMetricsMapper } from "../Mapper/dashboardmetrics.mapper";
import { DashboardMetricsValidator } from "../Validator/dashboardmetrics.validator";

test.describe("Dashboard Metrics API", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of dashboardMetricsTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const validator = new DashboardMetricsValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();

                if (testCase.isContractFixture) {
                    const fixtureBody = resolveDashboardMetricsContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(true, "Missing dashboard metrics contract body");
                        return;
                    }

                    const mapped = DashboardMetricsMapper.map(fixtureBody);
                    validation.execute("Required Fields", () =>
                        assert.validateRequiredFields(fixtureBody, [
                            "success",
                            "data",
                        ]),
                    );
                    validation.execute("Contract Scenario", () =>
                        validator.validateScenario(mapped, testCase.scenario),
                    );
                    validation.printSummary(testCase.testName, 0);
                    return;
                }

                const api = new DashboardMetricsApi(authenticatedApi);
                const query = resolveDashboardMetricsQuery(testCase.scenario);
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
                    await api.getDashboardMetrics(query);

                await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );

                validation.execute("Status Validation", () =>
                    assert.validateStatusCode(rawResponse, 200, responseBody),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(
                        responseTime,
                        dashboardMetricsMaxResponseTimeMs,
                    ),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );
                validation.execute("Required Fields", () =>
                    assert.validateRequiredFields(responseBody, [
                        "success",
                        "data",
                    ]),
                );

                const mapped = DashboardMetricsMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("Dashboard Metrics Scenario", () =>
                    validator.validateScenario(mapped, testCase.scenario),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});
