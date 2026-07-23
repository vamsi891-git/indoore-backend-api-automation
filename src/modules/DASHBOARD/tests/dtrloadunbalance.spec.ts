import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrLoadUnbalanceApi } from "../Api/dtrloadunbalance.api";
import {
    dtrLoadUnbalanceMaxResponseTimeMs,
    dtrLoadUnbalanceTestCases,
    resolveDtrLoadUnbalanceContractBody,
    resolveDtrLoadUnbalanceQuery,
} from "../Data/dtrloadunbalance.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceAuthNegativeCases,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
    DtrLoadUnbalanceMapper,
    type DtrLoadUnbalanceErrorResponse,
} from "../Mapper/dtrloadunbalance.mapper";
import { DtrLoadUnbalanceValidator } from "../Validator/dtrloadunbalance.validator";

const LOAD_UNBALANCE_PATH = "/indore/dashboard/dtr/load-unbalance";

test.describe("DTR Load Unbalance API", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of dtrLoadUnbalanceTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new DtrLoadUnbalanceValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();

                if (testCase.isContractFixture) {
                    const fixtureBody = resolveDtrLoadUnbalanceContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(true, "Missing DTR load-unbalance contract body");
                        return;
                    }

                    const mapped = DtrLoadUnbalanceMapper.map(fixtureBody);
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

                const api = new DtrLoadUnbalanceApi(authenticatedApi);
                const query = resolveDtrLoadUnbalanceQuery(testCase.scenario);

                const { rawResponse, responseBody, responseTime } =
                    await api.getDtrLoadUnbalance(query);

                await PerformanceTracker.track(
                    rawResponse,
                    testCase.testName,
                    rawResponse.url(),
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
                        dtrLoadUnbalanceMaxResponseTimeMs,
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

                const mapped = DtrLoadUnbalanceMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("DTR Load Unbalance Scenario", () =>
                    validator.validateScenario(mapped, testCase.scenario),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});

authTest.describe("DTR Load Unbalance API — Auth Negative", () => {
    authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const authCase of dtrUnbalanceAuthNegativeCases) {
        authTest(
            `GET ${LOAD_UNBALANCE_PATH} — ${authCase.testName}`,
            {
                tag: [
                    ...authCase.tags,
                    "@dtr-load-unbalance",
                ],
            },
            async ({ unauthenticatedApi }) => {
                const validator = new DtrLoadUnbalanceValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                const started = Date.now();

                const rawResponse = await unauthenticatedApi.get(
                    LOAD_UNBALANCE_PATH,
                    { headers: authCase.headers },
                );
                if (
                    BackendResponse.shouldSkipRateLimit(
                        rawResponse.status(),
                        `DTR load-unbalance ${authCase.testName}`,
                    )
                ) {
                    authTest.skip(
                        true,
                        `Rate limited (429) on ${LOAD_UNBALANCE_PATH} — retry later`,
                    );
                    return;
                }
                const responseBody = await rawResponse.json().catch(() => ({}));
                const responseTime = Date.now() - started;

                await PerformanceTracker.track(
                    rawResponse,
                    `DTR load-unbalance ${authCase.expectedErrorCode}`,
                    rawResponse.url(),
                    responseTime,
                );

                validation.execute("Status (auth negative)", () =>
                    assert.validateStatusCode(
                        rawResponse,
                        authCase.expectedStatus,
                        responseBody,
                    ),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Auth Error Envelope", () => {
                    if (
                        authCase.expectedErrorCode ===
                        dtrUnbalanceAccessTokenInvalidCode
                    ) {
                        validator.validateAccessTokenInvalidError(
                            responseBody as DtrLoadUnbalanceErrorResponse,
                        );
                    } else if (
                        authCase.expectedErrorCode ===
                        dtrUnbalanceUnauthorizedCode
                    ) {
                        validator.validateUnauthorizedError(
                            responseBody as DtrLoadUnbalanceErrorResponse,
                        );
                    } else {
                        validator.validateAuthError(
                            responseBody as DtrLoadUnbalanceErrorResponse,
                            authCase.expectedErrorCode,
                            authCase.expectedMessage,
                        );
                    }
                });

                validation.printSummary(
                    `DTR Load Unbalance — ${authCase.expectedErrorCode}`,
                    responseTime,
                );
            },
        );
    }
});
