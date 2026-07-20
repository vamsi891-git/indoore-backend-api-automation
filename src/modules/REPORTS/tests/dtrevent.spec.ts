import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrEventApi } from "../Api/dtrevent.api";
import { dtrEventMaxResponseTimeMs, dtrEventTestCases, resolveDtrEventContractBody, resolveDtrEventQuery,} from "../Data/dtrevent.data";
import { DtrEventMapper, type DtrEventErrorBody,} from "../Mapper/dtrevent.mapper";
import { DtrEventValidator } from "../Validator/dtrevent.validator";
test.describe("DTR Event Report API", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    for (const testCase of dtrEventTestCases) {
        test(testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new DtrEventValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                if (testCase.isContractFixture) {
                    const fixtureBody = resolveDtrEventContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(true, "Missing DTR event contract body");
                        return;
                    }
                    const mapped = DtrEventMapper.map(fixtureBody);
                    validation.execute("Required Fields", () =>
                        assert.validateRequiredFields(fixtureBody, ["success","data",]),
                    );
                    validation.execute("Contract Scenario", () =>
                        validator.validateScenario(mapped, testCase.scenario),
                    );
                    validation.printSummary(testCase.testName, 0);
                    return;
                }
                const api = new DtrEventApi(authenticatedApi);
                const query = resolveDtrEventQuery(testCase.scenario);
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
                    await api.getDtrEvent(query);
                await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );
                validation.execute("Status Validation", () =>
                    assert.validateStatusCode(rawResponse,expectedStatus,responseBody,),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(responseTime,dtrEventMaxResponseTimeMs,),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );
                if (expectedStatus !== 200) {
                    validation.execute("Validation Error", () =>
                        validator.validateValidationError(
                            responseBody as DtrEventErrorBody,
                        ),
                    );
                    validation.printSummary(testCase.testName, responseTime);
                    return;
                }
                validation.execute("Required Fields", () =>
                    assert.validateRequiredFields(responseBody, ["success","data",]),
                );
                const mapped = DtrEventMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("DTR Event Scenario", () =>
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
