import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrConsumptionApi } from "../Api/dtrconsumption.api";
import {
    dtrConsumptionMaxResponseTimeMs,
    dtrConsumptionTestCases,
    resolveDtrConsumptionContractBody,
    resolveDtrConsumptionExpectedPeriod,
    resolveDtrConsumptionQuery,
} from "../Data/dtrconsumption.data";
import {
    DtrConsumptionMapper,
    type DtrConsumptionErrorResponse,
} from "../Mapper/dtrconsumption.mapper";
import { DtrConsumptionValidator } from "../Validator/dtrconsumption.validator";

test.describe("DTR Consumption API", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of dtrConsumptionTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new DtrConsumptionValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();

                if (testCase.isContractFixture) {
                    const fixtureBody = resolveDtrConsumptionContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(true, "Missing DTR consumption contract body");
                        return;
                    }

                    const mapped = DtrConsumptionMapper.map(fixtureBody);
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

                const api = new DtrConsumptionApi(authenticatedApi);
                const query = resolveDtrConsumptionQuery(testCase.scenario);
                const expectedPeriod = resolveDtrConsumptionExpectedPeriod(
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
                const endpoint = `/indore/dashboard/dtr/consumption${
                    queryString ? `?${queryString}` : ""
                }`;

                const { rawResponse, responseBody, responseTime } =
                    await api.getDtrConsumption(query);

                await PerformanceTracker.track(
                    rawResponse,
                    testCase.testName,
                    `${process.env.BASE_URL}${endpoint}`,
                    responseTime,
                );

                validation.execute("Status Validation", () =>
                    assert.validateStatusCode(
                        rawResponse,
                        expectedStatus,
                        responseBody,
                    ),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(
                        responseTime,
                        dtrConsumptionMaxResponseTimeMs,
                    ),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );

                if (testCase.scenario === "invalid_period") {
                    validation.execute("Invalid Period Error", () =>
                        validator.validateInvalidPeriodError(
                            responseBody as DtrConsumptionErrorResponse,
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

                const mapped = DtrConsumptionMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("DTR Consumption Scenario", () =>
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
