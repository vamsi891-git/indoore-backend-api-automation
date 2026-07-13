import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrVoltageUnbalanceApi } from "../Api/dtrvoltageunbalance.api";
import {
    dtrVoltageUnbalanceMaxResponseTimeMs,
    dtrVoltageUnbalanceTestCases,
    resolveDtrVoltageUnbalanceContractBody,
    resolveDtrVoltageUnbalanceQuery,
} from "../Data/dtrvoltageunbalance.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceAuthNegativeCases,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
    DtrVoltageUnbalanceMapper,
    type DtrVoltageUnbalanceErrorResponse,
} from "../Mapper/dtrvoltageunbalance.mapper";
import { DtrVoltageUnbalanceValidator } from "../Validator/dtrvoltageunbalance.validator";

const VOLTAGE_UNBALANCE_PATH = "/indore/dashboard/dtr/voltage-unbalance";

test.describe("DTR Voltage Unbalance API", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of dtrVoltageUnbalanceTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new DtrVoltageUnbalanceValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();

                if (testCase.isContractFixture) {
                    const fixtureBody = resolveDtrVoltageUnbalanceContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(
                            true,
                            "Missing DTR voltage-unbalance contract body",
                        );
                        return;
                    }

                    const mapped = DtrVoltageUnbalanceMapper.map(fixtureBody);
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

                const api = new DtrVoltageUnbalanceApi(authenticatedApi);
                const query = resolveDtrVoltageUnbalanceQuery(testCase.scenario);

                const { rawResponse, responseBody, responseTime } =
                    await api.getDtrVoltageUnbalance(query);

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
                        dtrVoltageUnbalanceMaxResponseTimeMs,
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

                const mapped = DtrVoltageUnbalanceMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("DTR Voltage Unbalance Scenario", () =>
                    validator.validateScenario(mapped, testCase.scenario),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});

authTest.describe("DTR Voltage Unbalance API — Auth Negative", () => {
    authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const authCase of dtrUnbalanceAuthNegativeCases) {
        authTest(
            `GET ${VOLTAGE_UNBALANCE_PATH} — ${authCase.testName}`,
            {
                tag: [
                    ...authCase.tags,
                    "@dtr-voltage-unbalance",
                ],
            },
            async ({ unauthenticatedApi }) => {
                const validator = new DtrVoltageUnbalanceValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                const started = Date.now();

                const rawResponse = await unauthenticatedApi.get(
                    VOLTAGE_UNBALANCE_PATH,
                    { headers: authCase.headers },
                );
                const responseBody = await rawResponse.json().catch(() => ({}));
                const responseTime = Date.now() - started;

                await PerformanceTracker.track(
                    rawResponse,
                    `DTR voltage-unbalance ${authCase.expectedErrorCode}`,
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
                            responseBody as DtrVoltageUnbalanceErrorResponse,
                        );
                    } else if (
                        authCase.expectedErrorCode ===
                        dtrUnbalanceUnauthorizedCode
                    ) {
                        validator.validateUnauthorizedError(
                            responseBody as DtrVoltageUnbalanceErrorResponse,
                        );
                    } else {
                        validator.validateAuthError(
                            responseBody as DtrVoltageUnbalanceErrorResponse,
                            authCase.expectedErrorCode,
                            authCase.expectedMessage,
                        );
                    }
                });

                validation.printSummary(
                    `DTR Voltage Unbalance — ${authCase.expectedErrorCode}`,
                    responseTime,
                );
            },
        );
    }
});
