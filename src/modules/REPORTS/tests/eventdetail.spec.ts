import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { EventDetailApi } from "../Api/eventdetail.api";
import {
    eventDetailMaxResponseTimeMs,
    eventDetailTestCases,
    resolveEventDetailContractBody,
    resolveEventDetailQuery,
} from "../Data/eventdetail.data";
import {
    EventDetailMapper,
    type EventDetailErrorBody,
} from "../Mapper/eventdetail.mapper";
import { EventDetailValidator } from "../Validator/eventdetail.validator";

test.describe("Event Detail Report API", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of eventDetailTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new EventDetailValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();

                if (testCase.isContractFixture) {
                    const fixtureBody = resolveEventDetailContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(true, "Missing event detail contract body");
                        return;
                    }

                    const mapped = EventDetailMapper.map(fixtureBody);
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

                const api = new EventDetailApi(authenticatedApi);
                const query = resolveEventDetailQuery(testCase.scenario);
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
                    await api.getEventDetail(query);

                await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
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
                        eventDetailMaxResponseTimeMs,
                    ),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );

                if (expectedStatus !== 200) {
                    validation.execute("Validation Error", () =>
                        validator.validateValidationError(
                            responseBody as EventDetailErrorBody,
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

                const mapped = EventDetailMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("Event Detail Scenario", () =>
                    validator.validateScenario(
                        mapped,
                        testCase.scenario,
                        query.page,
                        query.limit,
                    ),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});
