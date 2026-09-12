import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrVoltageUnbalanceDetailsApi } from "../Api/dtrvoltageunbalancedetails.api";
import {
    dtrVoltageUnbalanceDetailsMaxResponseTimeMs,
    dtrVoltageUnbalanceDetailsTestCases,
    resolveDtrVoltageUnbalanceDetailsContractBody,
    resolveDtrVoltageUnbalanceDetailsQuery,
} from "../Data/dtrvoltageunbalancedetails.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceAuthNegativeCases,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
    DtrVoltageUnbalanceDetailsMapper,
    type DtrVoltageUnbalanceDetailsErrorResponse,
} from "../Mapper/dtrvoltageunbalancedetails.mapper";
import { DtrVoltageUnbalanceDetailsValidator } from "../Validator/dtrvoltageunbalancedetails.validator";

const VOLTAGE_UNBALANCE_DETAILS_PATH =
    "/indore/dashboard/dtr/voltage-unbalance-details";

test.describe("Dashboard — DTR voltage unbalance list", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of dtrVoltageUnbalanceDetailsTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new DtrVoltageUnbalanceDetailsValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();

                if (testCase.isContractFixture) {
                    const fixtureBody =
                        resolveDtrVoltageUnbalanceDetailsContractBody(
                            testCase.scenario,
                        );
                    if (!fixtureBody) {
                        test.skip(
                            true,
                            "Missing DTR voltage-unbalance-details contract body",
                        );
                        return;
                    }

                    const mapped =
                        DtrVoltageUnbalanceDetailsMapper.map(fixtureBody);
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

                const api = new DtrVoltageUnbalanceDetailsApi(authenticatedApi);
                const query = resolveDtrVoltageUnbalanceDetailsQuery(
                    testCase.scenario,
                );

                const { rawResponse, responseBody, responseTime } =
                    await api.getDtrVoltageUnbalanceDetails(query);

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
                        dtrVoltageUnbalanceDetailsMaxResponseTimeMs,
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

                const mapped =
                    DtrVoltageUnbalanceDetailsMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute(
                    "DTR Voltage Unbalance Details Scenario",
                    () =>
                        validator.validateScenario(
                            mapped,
                            testCase.scenario,
                            query,
                        ),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});

authTest.describe("DTR voltage unbalance list — cannot open without a valid login", () => {
    authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const authCase of dtrUnbalanceAuthNegativeCases) {
        authTest(
            `${authCase.testName}`,
            {
                tag: [
                    ...authCase.tags,
                    "@dtr-voltage-unbalance-details",
                ],
            },
            async ({ unauthenticatedApi }) => {
                const validator = new DtrVoltageUnbalanceDetailsValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                const started = Date.now();

                const rawResponse = await unauthenticatedApi.get(
                    VOLTAGE_UNBALANCE_DETAILS_PATH,
                    {
                        headers: authCase.headers,
                        params: {
                            severity: "severe",
                            page: 1,
                            limit: 10,
                        },
                    },
                );
                if (
                    BackendResponse.shouldSkipRateLimit(
                        rawResponse.status(),
                        `DTR voltage-unbalance-details ${authCase.testName}`,
                    )
                ) {
                    authTest.skip(
                        true,
                        `Rate limited (429) on ${VOLTAGE_UNBALANCE_DETAILS_PATH} — retry later`,
                    );
                    return;
                }
                const responseBody = await rawResponse.json().catch(() => ({}));
                const responseTime = Date.now() - started;

                await PerformanceTracker.track(
                    rawResponse,
                    `DTR voltage-unbalance-details ${authCase.expectedErrorCode}`,
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
                            responseBody as DtrVoltageUnbalanceDetailsErrorResponse,
                        );
                    } else if (
                        authCase.expectedErrorCode ===
                        dtrUnbalanceUnauthorizedCode
                    ) {
                        validator.validateUnauthorizedError(
                            responseBody as DtrVoltageUnbalanceDetailsErrorResponse,
                        );
                    } else {
                        validator.validateAuthError(
                            responseBody as DtrVoltageUnbalanceDetailsErrorResponse,
                            authCase.expectedErrorCode,
                            authCase.expectedMessage,
                        );
                    }
                });

                validation.printSummary(
                    `DTR Voltage Unbalance Details — ${authCase.expectedErrorCode}`,
                    responseTime,
                );
            },
        );
    }
});
